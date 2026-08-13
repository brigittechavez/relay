import { Affiliate } from '../../models/affiliate';
import { Campaign } from '../../models/campaign';
import { Page } from '../../models/common';
import { Organization } from '../../models/organization';
import { computeMatchScore, evaluateEligibility } from '../../logic/matching';
import { DemoDatabase, nextId } from '../../store/demo-database';
import { DemoStore } from '../../store/demo-store';
import { demoDate } from '../../seed/demo-clock';
import { MockRequest, MockRoute, notFound } from '../router';

/**
 * Catálogo: campañas, organizaciones y afiliados.
 *
 * El filtrado y la ordenación viven en el servidor simulado, no en los
 * componentes. Es lo que haría un backend real y lo que permite que la vista
 * del marketplace se limite a pedir una página de resultados.
 */
export function catalogRoutes(store: DemoStore): MockRoute[] {
  return [
    { method: 'GET', pattern: '/api/campaigns', handle: (r) => listCampaigns(store.read(), r) },
    {
      method: 'GET',
      pattern: '/api/campaigns/:slug',
      handle: (r) => findCampaign(store.read(), r.params['slug']),
    },
    {
      method: 'POST',
      pattern: '/api/campaigns',
      handle: (r) => store.write((db) => createCampaign(db, r.body as Partial<Campaign>)),
    },
    {
      method: 'PATCH',
      pattern: '/api/campaigns/:id',
      handle: (r) =>
        store.write((db) => updateCampaign(db, r.params['id'], r.body as Partial<Campaign>)),
    },

    {
      method: 'GET',
      pattern: '/api/organizations',
      handle: () => store.read().organizations,
    },
    {
      method: 'GET',
      pattern: '/api/organizations/:slug',
      handle: (r) =>
        store.read().organizations.find((item) => item.slug === r.params['slug']) ??
        notFound('Organización'),
    },
    {
      method: 'POST',
      pattern: '/api/organizations',
      handle: (r) => store.write((db) => createOrganization(db, r.body as Partial<Organization>)),
    },
    {
      method: 'PATCH',
      pattern: '/api/organizations/:id',
      handle: (r) =>
        store.write((db) => {
          const index = db.organizations.findIndex((item) => item.id === r.params['id']);
          if (index === -1) notFound('Organización');

          db.organizations[index] = {
            ...db.organizations[index],
            ...(r.body as Partial<Organization>),
          };
          return db.organizations[index];
        }),
    },

    { method: 'GET', pattern: '/api/affiliates', handle: (r) => listAffiliates(store.read(), r) },
    {
      method: 'GET',
      pattern: '/api/affiliates/:slug',
      handle: (r) =>
        store.read().affiliates.find((item) => item.slug === r.params['slug']) ??
        notFound('Afiliado'),
    },
    {
      method: 'PATCH',
      pattern: '/api/affiliates/:id',
      handle: (r) =>
        store.write((db) => {
          const index = db.affiliates.findIndex((item) => item.id === r.params['id']);
          if (index === -1) notFound('Afiliado');

          db.affiliates[index] = { ...db.affiliates[index], ...(r.body as Partial<Affiliate>) };
          return db.affiliates[index];
        }),
    },
  ];
}

type CampaignSort = 'relevance' | 'match' | 'commission' | 'recent' | 'conversion-rate';

function listCampaigns(database: DemoDatabase, request: MockRequest): Page<Campaign> {
  const query = request.query;
  const affiliate = findAffiliate(database, query.get('affiliateId'));

  let items = database.campaigns.filter((campaign) =>
    query.get('includeAll') === 'true'
      ? true
      : campaign.status === 'active' || campaign.status === 'scheduled',
  );

  const organizationId = query.get('organizationId');
  if (organizationId) {
    items = database.campaigns.filter((campaign) => campaign.organizationId === organizationId);
  }

  const term = query.get('q')?.trim().toLowerCase();
  if (term) {
    items = items.filter((campaign) => matchesTerm(database, campaign, term));
  }

  const categories = values(query, 'category');
  if (categories.length) {
    items = items.filter((campaign) => categories.includes(campaign.categoryId));
  }

  const subcategories = values(query, 'subcategory');
  if (subcategories.length) {
    items = items.filter((campaign) => subcategories.includes(campaign.subcategoryId));
  }

  const access = values(query, 'access');
  if (access.length) {
    items = items.filter((campaign) => access.includes(campaign.access));
  }

  const models = values(query, 'commissionModel');
  if (models.length) {
    items = items.filter((campaign) => models.includes(campaign.commission.model));
  }

  const tags = values(query, 'tag');
  if (tags.length) {
    items = items.filter((campaign) => tags.some((tag) => campaign.tags.includes(tag as never)));
  }

  const channels = values(query, 'channel');
  if (channels.length) {
    items = items.filter((campaign) =>
      channels.some((channel) => campaign.channels.includes(channel as never)),
    );
  }

  if (query.get('saved') === 'true') {
    items = items.filter((campaign) => database.savedCampaigns.includes(campaign.id));
  }

  if (query.get('newThisWeek') === 'true') {
    const cutoff = demoDate(-7);
    items = items.filter((campaign) => (campaign.publishedAt ?? campaign.createdAt) >= cutoff);
  }

  // Los filtros que dependen del perfil solo se aplican con un afiliado en
  // contexto: en el marketplace público no existen.
  if (affiliate) {
    if (query.get('eligible') === 'true') {
      items = items.filter((campaign) => evaluateEligibility(affiliate, campaign).eligible);
    }

    const minMatch = Number(query.get('minMatch') ?? 0);
    if (minMatch > 0) {
      items = items.filter((campaign) => computeMatchScore(affiliate, campaign) >= minMatch);
    }
  }

  const sort = (query.get('sort') ?? 'relevance') as CampaignSort;
  items = sortCampaigns(items, sort, affiliate);

  const page = Math.max(1, Number(query.get('page') ?? 1));
  const pageSize = Math.max(1, Number(query.get('pageSize') ?? 12));
  const start = (page - 1) * pageSize;

  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

function sortCampaigns(
  items: readonly Campaign[],
  sort: CampaignSort,
  affiliate: Affiliate | null,
): Campaign[] {
  const sorted = [...items];

  switch (sort) {
    case 'match':
      return affiliate
        ? sorted.sort((a, b) => computeMatchScore(affiliate, b) - computeMatchScore(affiliate, a))
        : sorted;

    case 'commission':
      return sorted.sort((a, b) => estimatedValue(b) - estimatedValue(a));

    case 'recent':
      return sorted.sort((a, b) =>
        (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
      );

    case 'conversion-rate':
      return sorted.sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate);

    case 'relevance':
    default:
      // Relevancia: rendimiento y volumen de afiliados activos, que es la
      // señal disponible cuando no hay perfil en contexto.
      return sorted.sort(
        (a, b) =>
          b.metrics.conversionRate * b.metrics.activeAffiliates -
          a.metrics.conversionRate * a.metrics.activeAffiliates,
      );
  }
}

/** Valor aproximado de una conversión, solo para poder ordenar por comisión. */
function estimatedValue(campaign: Campaign): number {
  const { commission, price } = campaign;

  if (commission.model === 'recurring') {
    return price * ((commission.percentage ?? 0) / 100) * (commission.recurringMonths ?? 1);
  }

  if (commission.model === 'percentage') {
    return price * ((commission.percentage ?? 0) / 100);
  }

  return commission.amount ?? 0;
}

function matchesTerm(database: DemoDatabase, campaign: Campaign, term: string): boolean {
  const organization = database.organizations.find((item) => item.id === campaign.organizationId);

  return [campaign.name, campaign.summary, campaign.offer, organization?.name ?? '']
    .join(' ')
    .toLowerCase()
    .includes(term);
}

function listAffiliates(database: DemoDatabase, request: MockRequest): Affiliate[] {
  const query = request.query;
  let items = [...database.affiliates];

  const term = query.get('q')?.trim().toLowerCase();
  if (term) {
    items = items.filter((affiliate) =>
      `${affiliate.name} ${affiliate.headline}`.toLowerCase().includes(term),
    );
  }

  const niches = values(query, 'niche');
  if (niches.length) {
    items = items.filter((affiliate) =>
      niches.some((niche) => affiliate.niches.includes(niche as never)),
    );
  }

  const types = values(query, 'type');
  if (types.length) {
    items = items.filter((affiliate) => types.includes(affiliate.type));
  }

  const levels = values(query, 'level');
  if (levels.length) {
    items = items.filter((affiliate) => levels.includes(affiliate.level));
  }

  const channels = values(query, 'channel');
  if (channels.length) {
    items = items.filter((affiliate) =>
      affiliate.channels.some((channel) => channels.includes(channel.id)),
    );
  }

  const minScore = Number(query.get('minScore') ?? 0);
  if (minScore > 0) {
    items = items.filter((affiliate) => affiliate.relayScore >= minScore);
  }

  if (query.get('saved') === 'true') {
    items = items.filter((affiliate) => database.savedAffiliates.includes(affiliate.id));
  }

  const excludeId = query.get('exclude');
  if (excludeId) {
    items = items.filter((affiliate) => affiliate.id !== excludeId);
  }

  return items.sort((a, b) => b.relayScore - a.relayScore);
}

function findCampaign(database: DemoDatabase, slug: string): Campaign {
  return (
    database.campaigns.find((campaign) => campaign.slug === slug || campaign.id === slug) ??
    notFound('Campaña')
  );
}

function findAffiliate(database: DemoDatabase, id: string | null): Affiliate | null {
  return id ? (database.affiliates.find((affiliate) => affiliate.id === id) ?? null) : null;
}

/**
 * Alta de organización desde el onboarding.
 *
 * Nace sin métricas ni señales de confianza: son datos que se ganan operando,
 * y regalarlos vaciaría de significado el perfil público del resto.
 */
function createOrganization(database: DemoDatabase, draft: Partial<Organization>): Organization {
  const slug = slugify(draft.name ?? 'organizacion', database);

  const organization: Organization = {
    id: slug,
    slug,
    name: draft.name ?? 'Nueva organización',
    initials: initialsOf(draft.name ?? 'NO'),
    kind: draft.kind ?? 'company',
    categoryId: draft.categoryId ?? 'servicios',
    tagline: draft.tagline ?? '',
    description: draft.description ?? '',
    location: draft.location ?? 'Lima, Perú',
    country: draft.country ?? 'PE',
    website: draft.website ?? '',
    plan: 'starter',
    trustSignals: [],
    metrics: {
      activeAffiliates: 0,
      averageReviewDays: 0,
      approvalRate: 0,
      completedCampaigns: 0,
    },
    team: [],
    createdAt: demoDate(0),
  };

  database.organizations = [organization, ...database.organizations];
  return organization;
}

function slugify(value: string, database: DemoDatabase): string {
  const base =
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'organizacion';

  const taken = new Set(database.organizations.map((item) => item.slug));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function createCampaign(database: DemoDatabase, draft: Partial<Campaign>): Campaign {
  const id = draft.slug || nextId(database, 'campaign');

  const campaign: Campaign = {
    id,
    slug: id,
    name: draft.name ?? 'Campaña sin nombre',
    organizationId: draft.organizationId ?? '',
    categoryId: draft.categoryId ?? 'servicios',
    subcategoryId: draft.subcategoryId ?? '',
    tags: draft.tags ?? [],
    summary: draft.summary ?? '',
    description: draft.description ?? '',
    offer: draft.offer ?? '',
    price: draft.price ?? 0,
    priceUnit: draft.priceUnit ?? 'one-time',
    commission: draft.commission ?? {
      model: 'fixed',
      amount: 0,
      conversionEvent: 'sale',
      attributionWindow: '30d',
    },
    access: draft.access ?? 'open',
    status: draft.status ?? 'active',
    duration: draft.duration ?? { type: 'evergreen' },
    requirements: draft.requirements ?? [],
    channels: draft.channels ?? [],
    niches: draft.niches ?? [],
    countries: draft.countries ?? ['PE'],
    audience: draft.audience ?? '',
    audienceTarget: draft.audienceTarget ?? 30000,
    restrictions: draft.restrictions ?? [],
    benefits: draft.benefits ?? [],
    landingUrl: draft.landingUrl ?? '',
    resources: draft.resources ?? [],
    promoCodeEnabled: draft.promoCodeEnabled ?? false,
    strategyQuestion: draft.strategyQuestion,
    goal: draft.goal ?? { label: '', target: 0, unit: 'conversions' },
    metrics: { activeAffiliates: 0, conversionRate: 0, conversions: 0, clicks: 0 },
    cover: draft.cover ?? 'servicios-01',
    createdAt: demoDate(0),
    publishedAt: draft.status === 'draft' ? undefined : demoDate(0),
  };

  database.campaigns = [campaign, ...database.campaigns];
  return campaign;
}

function updateCampaign(database: DemoDatabase, id: string, patch: Partial<Campaign>): Campaign {
  const index = database.campaigns.findIndex((campaign) => campaign.id === id);
  if (index === -1) notFound('Campaña');

  database.campaigns[index] = { ...database.campaigns[index], ...patch };
  return database.campaigns[index];
}

function values(query: URLSearchParams, key: string): string[] {
  return query
    .getAll(key)
    .flatMap((value) => value.split(','))
    .filter(Boolean);
}
