import { Application, ApplicationStatus, WITHDRAWABLE } from '../../models/application';
import { Partnership } from '../../models/tracking';
import { computeMatchScore, evaluateEligibility } from '../../logic/matching';
import { demoDate } from '../../seed/demo-clock';
import { DemoDatabase, nextId } from '../../store/demo-database';
import { DemoStore } from '../../store/demo-store';
import { conflict, MockRequest, MockRoute, notFound } from '../router';

/**
 * Solicitudes y vínculos activos.
 *
 * La modalidad de acceso decide el desenlace: una campaña abierta aprueba en
 * el acto y crea el vínculo; una selectiva o premium queda pendiente de que la
 * organización la resuelva desde su panel.
 */
export function applicationRoutes(store: DemoStore): MockRoute[] {
  return [
    {
      method: 'GET',
      pattern: '/api/applications',
      handle: (r) => listApplications(store.read(), r),
    },
    {
      method: 'POST',
      pattern: '/api/applications',
      handle: (r) => store.write((db) => submitApplication(db, r.body as ApplicationDraft)),
    },
    {
      method: 'PATCH',
      pattern: '/api/applications/:id',
      handle: (r) =>
        store.write((db) => transition(db, r.params['id'], r.body as ApplicationPatch)),
    },

    {
      method: 'GET',
      pattern: '/api/partnerships',
      handle: (r) => listPartnerships(store.read(), r),
    },
    {
      method: 'PATCH',
      pattern: '/api/partnerships/:id',
      handle: (r) =>
        store.write((db) => updatePartnership(db, r.params['id'], r.body as PartnershipPatch)),
    },
  ];
}

interface ApplicationDraft {
  readonly campaignId: string;
  readonly affiliateId: string;
  readonly strategy?: string;
  readonly channels?: readonly string[];
}

interface ApplicationPatch {
  readonly status: ApplicationStatus;
  readonly decisionNote?: string;
  readonly infoRequest?: string;
  readonly infoResponse?: string;
}

interface PartnershipPatch {
  readonly status: Partnership['status'];
  readonly statusNote?: string;
}

function listApplications(database: DemoDatabase, request: MockRequest): Application[] {
  const query = request.query;
  let items = [...database.applications];

  const affiliateId = query.get('affiliateId');
  if (affiliateId) items = items.filter((item) => item.affiliateId === affiliateId);

  const organizationId = query.get('organizationId');
  if (organizationId) items = items.filter((item) => item.organizationId === organizationId);

  const campaignId = query.get('campaignId');
  if (campaignId) items = items.filter((item) => item.campaignId === campaignId);

  const statuses = query.getAll('status').flatMap((value) => value.split(','));
  if (statuses.length) items = items.filter((item) => statuses.includes(item.status));

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function submitApplication(database: DemoDatabase, draft: ApplicationDraft): Application {
  const campaign = database.campaigns.find((item) => item.id === draft.campaignId);
  if (!campaign) notFound('Campaña');

  const affiliate = database.affiliates.find((item) => item.id === draft.affiliateId);
  if (!affiliate) notFound('Afiliado');

  const existing = database.applications.find(
    (item) =>
      item.campaignId === campaign.id &&
      item.affiliateId === affiliate.id &&
      item.status !== 'withdrawn' &&
      item.status !== 'rejected',
  );
  if (existing) conflict('Ya existe una solicitud activa para esta campaña');

  const eligibility = evaluateEligibility(affiliate, campaign);
  if (!eligibility.eligible) {
    conflict('El perfil no cumple los requisitos obligatorios de la campaña');
  }

  // En una campaña abierta no hay revisión: la adhesión es inmediata.
  const immediate = campaign.access === 'open';

  const application: Application = {
    id: nextId(database, 'app'),
    campaignId: campaign.id,
    affiliateId: affiliate.id,
    organizationId: campaign.organizationId,
    status: immediate ? 'approved' : 'submitted',
    strategy: draft.strategy,
    channels: (draft.channels ?? []) as Application['channels'],
    matchScore: computeMatchScore(affiliate, campaign),
    submittedAt: demoDate(0),
    decidedAt: immediate ? demoDate(0) : undefined,
    createdAt: demoDate(0),
  };

  database.applications = [application, ...database.applications];

  if (immediate) {
    createPartnership(database, application);
  } else {
    notifyOrganization(database, application);
  }

  return application;
}

function transition(database: DemoDatabase, id: string, patch: ApplicationPatch): Application {
  const index = database.applications.findIndex((item) => item.id === id);
  if (index === -1) notFound('Solicitud');

  const current = database.applications[index];

  if (patch.status === 'withdrawn' && !WITHDRAWABLE.includes(current.status)) {
    conflict('Esta solicitud ya no se puede retirar');
  }

  const decided = patch.status === 'approved' || patch.status === 'rejected';

  const updated: Application = {
    ...current,
    status: patch.status,
    decisionNote: patch.decisionNote ?? current.decisionNote,
    infoRequest: patch.infoRequest ?? current.infoRequest,
    infoResponse: patch.infoResponse ?? current.infoResponse,
    decidedAt: decided ? demoDate(0) : current.decidedAt,
  };

  database.applications[index] = updated;

  if (patch.status === 'approved') {
    createPartnership(database, updated);
    notifyAffiliate(database, updated);
  }

  if (patch.status === 'rejected') {
    notifyAffiliateRejection(database, updated);
  }

  return updated;
}

/**
 * Aprobar crea el vínculo y, si la campaña lo permite, el código promocional
 * personal. Los links los crea el afiliado: es la acción con la que empieza a
 * trabajar la campaña.
 */
function createPartnership(database: DemoDatabase, application: Application): void {
  const alreadyLinked = database.partnerships.some(
    (item) =>
      item.campaignId === application.campaignId &&
      item.affiliateId === application.affiliateId &&
      item.status !== 'ended',
  );
  if (alreadyLinked) return;

  database.partnerships = [
    {
      id: nextId(database, 'ptn'),
      campaignId: application.campaignId,
      affiliateId: application.affiliateId,
      organizationId: application.organizationId,
      status: 'active',
      joinedAt: demoDate(0),
    },
    ...database.partnerships,
  ];

  const campaign = database.campaigns.find((item) => item.id === application.campaignId);
  const affiliate = database.affiliates.find((item) => item.id === application.affiliateId);

  if (campaign?.promoCodeEnabled && affiliate) {
    const alreadyCoded = database.promoCodes.some(
      (code) => code.campaignId === campaign.id && code.affiliateId === affiliate.id,
    );

    if (!alreadyCoded) {
      database.promoCodes = [
        {
          id: nextId(database, 'code'),
          campaignId: campaign.id,
          affiliateId: affiliate.id,
          code: buildPromoCode(affiliate.name, campaign),
          benefit: buildPromoBenefit(campaign),
          active: true,
          conversions: 0,
        },
        ...database.promoCodes,
      ];
    }
  }

  database.timeline = [
    {
      id: nextId(database, 'tl'),
      campaignId: application.campaignId,
      affiliateId: application.affiliateId,
      label: 'Afiliado aprobado',
      detail: affiliate?.name,
      tone: 'success',
      occurredAt: demoDate(0),
    },
    ...database.timeline,
  ];
}

function updatePartnership(
  database: DemoDatabase,
  id: string,
  patch: PartnershipPatch,
): Partnership {
  const index = database.partnerships.findIndex((item) => item.id === id);
  if (index === -1) notFound('Vínculo');

  const updated: Partnership = {
    ...database.partnerships[index],
    status: patch.status,
    statusNote: patch.statusNote,
    endedAt: patch.status === 'ended' ? demoDate(0) : undefined,
  };

  database.partnerships[index] = updated;

  // Al abandonar una campaña los links dejan de estar activos, pero el
  // historial de conversiones y comisiones se conserva.
  if (patch.status === 'ended') {
    database.links = database.links.map((link) =>
      link.campaignId === updated.campaignId && link.affiliateId === updated.affiliateId
        ? { ...link, active: false }
        : link,
    );
  }

  return updated;
}

function listPartnerships(database: DemoDatabase, request: MockRequest): Partnership[] {
  const query = request.query;
  let items = [...database.partnerships];

  const affiliateId = query.get('affiliateId');
  if (affiliateId) items = items.filter((item) => item.affiliateId === affiliateId);

  const organizationId = query.get('organizationId');
  if (organizationId) items = items.filter((item) => item.organizationId === organizationId);

  const campaignId = query.get('campaignId');
  if (campaignId) items = items.filter((item) => item.campaignId === campaignId);

  const statuses = query.getAll('status').flatMap((value) => value.split(','));
  if (statuses.length) items = items.filter((item) => statuses.includes(item.status));

  return items.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
}

function notifyOrganization(database: DemoDatabase, application: Application): void {
  const campaign = database.campaigns.find((item) => item.id === application.campaignId);
  const affiliate = database.affiliates.find((item) => item.id === application.affiliateId);

  database.notifications = [
    {
      id: nextId(database, 'ntf'),
      kind: 'application-received',
      audience: application.organizationId,
      title: `Nueva solicitud en ${campaign?.name ?? 'una campaña'}`,
      body: `${affiliate?.name ?? 'Un afiliado'} ha solicitado unirse · match ${application.matchScore}%`,
      link: `/app/organization/${application.organizationId}/campanas/${application.campaignId}/aplicaciones`,
      read: false,
      createdAt: demoDate(0),
    },
    ...database.notifications,
  ];

  database.timeline = [
    {
      id: nextId(database, 'tl'),
      campaignId: application.campaignId,
      affiliateId: application.affiliateId,
      label: 'Nueva solicitud',
      detail: `${affiliate?.name ?? 'Afiliado'} · match ${application.matchScore}%`,
      tone: 'neutral',
      occurredAt: demoDate(0),
    },
    ...database.timeline,
  ];
}

function notifyAffiliate(database: DemoDatabase, application: Application): void {
  const campaign = database.campaigns.find((item) => item.id === application.campaignId);

  database.notifications = [
    {
      id: nextId(database, 'ntf'),
      kind: 'application-approved',
      audience: 'affiliate',
      title: `Tu solicitud a ${campaign?.name ?? 'la campaña'} fue aprobada`,
      body: 'Ya puedes crear tus links de seguimiento y copiar tu código promocional.',
      link: `/app/affiliate/campanas/${application.campaignId}`,
      read: false,
      createdAt: demoDate(0),
    },
    ...database.notifications,
  ];
}

function notifyAffiliateRejection(database: DemoDatabase, application: Application): void {
  const campaign = database.campaigns.find((item) => item.id === application.campaignId);

  database.notifications = [
    {
      id: nextId(database, 'ntf'),
      kind: 'application-rejected',
      audience: 'affiliate',
      title: `${campaign?.name ?? 'La campaña'} no aprobó tu solicitud`,
      body: application.decisionNote ?? 'La organización no ha indicado un motivo.',
      link: `/app/affiliate/aplicaciones/${application.id}`,
      read: false,
      createdAt: demoDate(0),
    },
    ...database.notifications,
  ];
}

/** `LUCIA20` para porcentajes, `LUCIA300` para importes fijos. */
function buildPromoCode(
  name: string,
  campaign: { commission: { model: string; percentage?: number; amount?: number } },
): string {
  const first = name.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const suffix =
    campaign.commission.model === 'percentage' || campaign.commission.model === 'recurring'
      ? (campaign.commission.percentage ?? 10)
      : (campaign.commission.amount ?? 0);

  return `${first}${suffix}`;
}

function buildPromoBenefit(campaign: {
  commission: { model: string; percentage?: number; amount?: number };
}): string {
  if (campaign.commission.model === 'percentage' || campaign.commission.model === 'recurring') {
    return `${campaign.commission.percentage}% de descuento`;
  }

  return `S/ ${campaign.commission.amount} de descuento`;
}
