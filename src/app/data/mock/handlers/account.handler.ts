import { Affiliate } from '../../models/affiliate';
import { Notification, TimelineEvent } from '../../models/notification';
import { demoDate, DEMO_TODAY } from '../../seed/demo-clock';
import { DEMO_AFFILIATE_ID } from '../../seed/affiliates.seed';
import { DemoDatabase, DemoSession, nextId } from '../../store/demo-database';
import { DemoStore } from '../../store/demo-store';
import { conflict, MockRequest, MockRoute, notFound } from '../router';

/**
 * Sesión demo, guardados, notificaciones y reinicio.
 *
 * No hay autenticación: entrar en la demo es elegir un punto de partida. La
 * «sesión» solo guarda qué perfil y qué organizaciones están disponibles y cuál
 * es el contexto activo.
 */
export function accountRoutes(store: DemoStore): MockRoute[] {
  return [
    { method: 'GET', pattern: '/api/session', handle: () => store.read().session },
    {
      method: 'POST',
      pattern: '/api/session',
      handle: (r) => store.write((db) => startSession(db, r.body as SessionRequest)),
    },
    {
      method: 'PATCH',
      pattern: '/api/session',
      handle: (r) => store.write((db) => patchSession(db, r.body as Partial<DemoSession>)),
    },
    {
      method: 'DELETE',
      pattern: '/api/session',
      handle: () =>
        store.write((db) => {
          db.session = null;
          return null;
        }),
    },

    {
      method: 'GET',
      pattern: '/api/saved',
      handle: () => ({
        campaigns: store.read().savedCampaigns,
        affiliates: store.read().savedAffiliates,
        compared: store.read().comparedCampaigns,
      }),
    },
    {
      method: 'POST',
      pattern: '/api/saved',
      handle: (r) => store.write((db) => toggleSaved(db, r.body as SavedRequest)),
    },
    {
      method: 'POST',
      pattern: '/api/compare',
      handle: (r) => store.write((db) => toggleCompare(db, r.body as { campaignId: string })),
    },

    {
      method: 'GET',
      pattern: '/api/notifications',
      handle: (r) => listNotifications(store.read(), r),
    },
    {
      method: 'PATCH',
      pattern: '/api/notifications/:id',
      handle: (r) => store.write((db) => markRead(db, r.params['id'])),
    },
    {
      method: 'POST',
      pattern: '/api/notifications/read-all',
      handle: (r) => store.write((db) => markAllRead(db, r.body as { audience: string })),
    },

    { method: 'GET', pattern: '/api/timeline', handle: (r) => listTimeline(store.read(), r) },

    {
      method: 'POST',
      pattern: '/api/demo/reset',
      handle: () => {
        store.reset();
        return { resetAt: DEMO_TODAY };
      },
    },
  ];
}

interface SessionRequest {
  /** `affiliate` entra como Lucía Vega; `organization` como Norte Digital. */
  readonly as: 'affiliate' | 'organization' | 'new';
  readonly name?: string;
  readonly email?: string;
}

interface SavedRequest {
  readonly kind: 'campaign' | 'affiliate';
  readonly id: string;
}

const DEMO_ORGANIZATION_ID = 'norte-digital';

function startSession(database: DemoDatabase, request: SessionRequest): DemoSession {
  if (request.as === 'new') {
    return createAccount(database, request);
  }

  const affiliate = database.affiliates.find((item) => item.id === DEMO_AFFILIATE_ID);
  if (!affiliate) notFound('Perfil demo');

  const session: DemoSession = {
    name: affiliate.name,
    email: 'lucia@relay.demo',
    affiliateId: affiliate.id,
    organizationIds: [DEMO_ORGANIZATION_ID],
    activeWorkspaceId: request.as === 'affiliate' ? affiliate.id : DEMO_ORGANIZATION_ID,
    onboardingCompleted: true,
    startedAt: demoDate(0),
  };

  database.session = session;
  return session;
}

/**
 * Registro simulado.
 *
 * Crea un perfil de afiliado vacío que el onboarding rellena. No se crea
 * organización: eso ocurre si la persona elige ese camino en el onboarding.
 */
function createAccount(database: DemoDatabase, request: SessionRequest): DemoSession {
  const name = request.name?.trim() || 'Nueva cuenta';
  const id = nextId(database, 'affiliate');

  const affiliate: Affiliate = {
    id,
    slug: id,
    name,
    headline: '',
    bio: '',
    initials: initialsOf(name),
    type: 'creator',
    location: 'Lima, Perú',
    country: 'PE',
    level: 'starter',
    relayScore: 0,
    scoreBreakdown: { performance: 0, experience: 0, profile: 0, consistency: 0 },
    levelProgress: 0,
    profileCompleteness: 20,
    niches: [],
    channels: [],
    badges: [],
    available: true,
    portfolio: [],
    experience: [],
    averageConversionRate: 0,
    visibility: {
      audience: true,
      results: true,
      availability: true,
      channels: true,
      relayScore: true,
    },
    joinedAt: demoDate(0),
  };

  database.affiliates = [affiliate, ...database.affiliates];

  const session: DemoSession = {
    name,
    email: request.email?.trim() || 'nueva@relay.demo',
    affiliateId: affiliate.id,
    organizationIds: [],
    activeWorkspaceId: affiliate.id,
    onboardingCompleted: false,
    startedAt: demoDate(0),
  };

  database.session = session;
  return session;
}

function patchSession(database: DemoDatabase, patch: Partial<DemoSession>): DemoSession {
  if (!database.session) conflict('No hay una sesión demo activa');

  database.session = { ...database.session, ...patch };
  return database.session;
}

function toggleSaved(database: DemoDatabase, request: SavedRequest): { saved: boolean } {
  const list = request.kind === 'campaign' ? database.savedCampaigns : database.savedAffiliates;
  const index = list.indexOf(request.id);

  if (index === -1) {
    list.push(request.id);
    return { saved: true };
  }

  list.splice(index, 1);

  // Dejar de guardar una campaña la saca también de la comparación: no tiene
  // sentido comparar algo que ya no está en la lista.
  if (request.kind === 'campaign') {
    database.comparedCampaigns = database.comparedCampaigns.filter((id) => id !== request.id);
  }

  return { saved: false };
}

/** La comparación admite un máximo de tres campañas: más no cabe en pantalla. */
const COMPARE_LIMIT = 3;

function toggleCompare(
  database: DemoDatabase,
  request: { campaignId: string },
): { compared: string[] } {
  const index = database.comparedCampaigns.indexOf(request.campaignId);

  if (index !== -1) {
    database.comparedCampaigns.splice(index, 1);
  } else {
    if (database.comparedCampaigns.length >= COMPARE_LIMIT) {
      conflict(`Solo puedes comparar ${COMPARE_LIMIT} campañas a la vez`);
    }
    database.comparedCampaigns.push(request.campaignId);
  }

  return { compared: [...database.comparedCampaigns] };
}

function listNotifications(database: DemoDatabase, request: MockRequest): Notification[] {
  const audience = request.query.get('audience');
  const items = audience
    ? database.notifications.filter((item) => item.audience === audience)
    : database.notifications;

  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function markRead(database: DemoDatabase, id: string): Notification {
  const index = database.notifications.findIndex((item) => item.id === id);
  if (index === -1) notFound('Notificación');

  database.notifications[index] = { ...database.notifications[index], read: true };
  return database.notifications[index];
}

function markAllRead(database: DemoDatabase, request: { audience: string }): Notification[] {
  database.notifications = database.notifications.map((item) =>
    item.audience === request.audience ? { ...item, read: true } : item,
  );

  return database.notifications.filter((item) => item.audience === request.audience);
}

function listTimeline(database: DemoDatabase, request: MockRequest): TimelineEvent[] {
  const campaignId = request.query.get('campaignId');
  const affiliateId = request.query.get('affiliateId');

  let items = [...database.timeline];
  if (campaignId) items = items.filter((item) => item.campaignId === campaignId);
  if (affiliateId) items = items.filter((item) => item.affiliateId === affiliateId);

  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
