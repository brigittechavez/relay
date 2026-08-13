import { ChannelId } from '../../models/taxonomy';
import {
  Conversion,
  ConversionStatus,
  Payout,
  PromoCode,
  ReferralLink,
} from '../../models/tracking';
import { commissionPerConversion } from '../../logic/commission';
import { SIMULATED_LINK_ACTIVITY } from '../../seed/activity.seed';
import { demoDate } from '../../seed/demo-clock';
import { DemoDatabase, nextId } from '../../store/demo-database';
import { DemoStore } from '../../store/demo-store';
import { conflict, MockRequest, MockRoute, notFound } from '../router';

/**
 * Links, códigos, conversiones y payouts.
 *
 * El seguimiento es simulado y así se documenta: al crear un link, RELAY le
 * atribuye el rendimiento típico de ese canal en la campaña, junto con las
 * conversiones que lo justifican. No hay redirección ni medición reales, pero
 * las cifras que se muestran sí están respaldadas por registros.
 */
export function trackingRoutes(store: DemoStore): MockRoute[] {
  return [
    { method: 'GET', pattern: '/api/referral-links', handle: (r) => listLinks(store.read(), r) },
    {
      method: 'POST',
      pattern: '/api/referral-links',
      handle: (r) => store.write((db) => createLink(db, r.body as LinkDraft)),
    },
    {
      method: 'PATCH',
      pattern: '/api/referral-links/:id',
      handle: (r) => store.write((db) => updateLink(db, r.params['id'], r.body as LinkPatch)),
    },

    { method: 'GET', pattern: '/api/promo-codes', handle: (r) => listCodes(store.read(), r) },

    { method: 'GET', pattern: '/api/conversions', handle: (r) => listConversions(store.read(), r) },
    {
      method: 'PATCH',
      pattern: '/api/conversions/:id',
      handle: (r) =>
        store.write((db) => updateConversion(db, r.params['id'], r.body as ConversionPatch)),
    },

    { method: 'GET', pattern: '/api/payouts', handle: (r) => listPayouts(store.read(), r) },
  ];
}

interface LinkDraft {
  readonly campaignId: string;
  readonly affiliateId: string;
  readonly name: string;
  readonly channel: ChannelId;
}

interface LinkPatch {
  readonly name?: string;
  readonly active?: boolean;
}

interface ConversionPatch {
  readonly status: ConversionStatus;
  readonly note?: string;
}

function listLinks(database: DemoDatabase, request: MockRequest): ReferralLink[] {
  const query = request.query;
  let items = [...database.links];

  const affiliateId = query.get('affiliateId');
  if (affiliateId) items = items.filter((item) => item.affiliateId === affiliateId);

  const campaignId = query.get('campaignId');
  if (campaignId) items = items.filter((item) => item.campaignId === campaignId);

  const organizationId = query.get('organizationId');
  if (organizationId) {
    const campaigns = new Set(
      database.campaigns
        .filter((campaign) => campaign.organizationId === organizationId)
        .map((campaign) => campaign.id),
    );
    items = items.filter((item) => campaigns.has(item.campaignId));
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function createLink(database: DemoDatabase, draft: LinkDraft): ReferralLink {
  const campaign = database.campaigns.find((item) => item.id === draft.campaignId);
  if (!campaign) notFound('Campaña');

  const partnership = database.partnerships.find(
    (item) =>
      item.campaignId === draft.campaignId &&
      item.affiliateId === draft.affiliateId &&
      item.status === 'active',
  );
  if (!partnership) conflict('Necesitas estar activo en la campaña para crear links');

  const activity = SIMULATED_LINK_ACTIVITY[draft.channel];
  const commission = commissionPerConversion(campaign.commission, campaign.price);

  const link: ReferralLink = {
    id: nextId(database, 'lnk'),
    campaignId: draft.campaignId,
    affiliateId: draft.affiliateId,
    name: draft.name.trim(),
    channel: draft.channel,
    slug: buildSlug(draft.name, database),
    active: true,
    clicks: activity.clicks,
    conversions: activity.conversions,
    commission: round(commission * activity.conversions),
    createdAt: demoDate(0),
  };

  database.links = [link, ...database.links];

  // Las conversiones que respaldan el rendimiento atribuido se materializan
  // como registros: así la tabla de conversiones y el KPI no se contradicen.
  database.conversions = [
    ...buildSimulatedConversions(database, link, campaign.organizationId, commission),
    ...database.conversions,
  ];

  database.timeline = [
    {
      id: nextId(database, 'tl'),
      campaignId: link.campaignId,
      affiliateId: link.affiliateId,
      label: 'Link creado',
      detail: link.name,
      tone: 'neutral',
      occurredAt: demoDate(0),
    },
    ...database.timeline,
  ];

  return link;
}

function buildSimulatedConversions(
  database: DemoDatabase,
  link: ReferralLink,
  organizationId: string,
  commission: number,
): Conversion[] {
  const campaign = database.campaigns.find((item) => item.id === link.campaignId);
  if (!campaign) return [];

  // Se reparten a lo largo de las últimas cuatro semanas para que la serie
  // temporal tenga forma en lugar de un único pico.
  const spread = 26;

  return Array.from({ length: link.conversions }, (_, index) => {
    const day = -Math.round(((index + 1) / link.conversions) * spread);
    const status: ConversionStatus = index === 0 ? 'validating' : index < 3 ? 'approved' : 'paid';

    return {
      id: nextId(database, 'CV'),
      campaignId: link.campaignId,
      affiliateId: link.affiliateId,
      organizationId,
      linkId: link.id,
      channel: link.channel,
      value: campaign.price,
      commission: round(commission),
      status,
      occurredAt: demoDate(day),
    };
  });
}

function updateLink(database: DemoDatabase, id: string, patch: LinkPatch): ReferralLink {
  const index = database.links.findIndex((item) => item.id === id);
  if (index === -1) notFound('Link');

  database.links[index] = {
    ...database.links[index],
    name: patch.name?.trim() ?? database.links[index].name,
    active: patch.active ?? database.links[index].active,
  };

  return database.links[index];
}

function listCodes(database: DemoDatabase, request: MockRequest): PromoCode[] {
  const query = request.query;
  let items = [...database.promoCodes];

  const affiliateId = query.get('affiliateId');
  if (affiliateId) items = items.filter((item) => item.affiliateId === affiliateId);

  const campaignId = query.get('campaignId');
  if (campaignId) items = items.filter((item) => item.campaignId === campaignId);

  return items;
}

function listConversions(database: DemoDatabase, request: MockRequest): Conversion[] {
  const query = request.query;
  let items = [...database.conversions];

  const affiliateId = query.get('affiliateId');
  if (affiliateId) items = items.filter((item) => item.affiliateId === affiliateId);

  const organizationId = query.get('organizationId');
  if (organizationId) items = items.filter((item) => item.organizationId === organizationId);

  const campaignId = query.get('campaignId');
  if (campaignId) items = items.filter((item) => item.campaignId === campaignId);

  const statuses = query.getAll('status').flatMap((value) => value.split(','));
  if (statuses.length) items = items.filter((item) => statuses.includes(item.status));

  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

/** Transiciones válidas del ciclo de validación de una conversión. */
const ALLOWED_TRANSITIONS: Record<ConversionStatus, readonly ConversionStatus[]> = {
  registered: ['validating', 'approved', 'rejected'],
  validating: ['approved', 'rejected'],
  approved: ['scheduled', 'refunded'],
  scheduled: ['paid', 'refunded'],
  paid: ['refunded'],
  rejected: [],
  refunded: [],
};

function updateConversion(database: DemoDatabase, id: string, patch: ConversionPatch): Conversion {
  const index = database.conversions.findIndex((item) => item.id === id);
  if (index === -1) notFound('Conversión');

  const current = database.conversions[index];

  if (!ALLOWED_TRANSITIONS[current.status].includes(patch.status)) {
    conflict(`No se puede pasar de «${current.status}» a «${patch.status}»`);
  }

  const updated: Conversion = {
    ...current,
    status: patch.status,
    note: patch.note ?? current.note,
    // Rechazar o reembolsar anula la comisión asociada.
    commission: patch.status === 'rejected' || patch.status === 'refunded' ? 0 : current.commission,
  };

  database.conversions[index] = updated;

  if (patch.status === 'approved') {
    database.notifications = [
      {
        id: nextId(database, 'ntf'),
        kind: 'commission-approved',
        audience: 'affiliate',
        title: `Tu comisión de S/ ${updated.commission} fue aprobada`,
        body: 'Se incluirá en el próximo pago programado.',
        link: '/app/affiliate/ganancias',
        read: false,
        createdAt: demoDate(0),
      },
      ...database.notifications,
    ];
  }

  return updated;
}

function listPayouts(database: DemoDatabase, request: MockRequest): Payout[] {
  const affiliateId = request.query.get('affiliateId');
  const items = affiliateId
    ? database.payouts.filter((item) => item.affiliateId === affiliateId)
    : database.payouts;

  return [...items].sort((a, b) =>
    (b.paidAt ?? b.expectedAt ?? '').localeCompare(a.paidAt ?? a.expectedAt ?? ''),
  );
}

function buildSlug(name: string, database: DemoDatabase): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);

  const taken = new Set(database.links.map((link) => link.slug));
  if (!taken.has(base)) return base || 'link';

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
