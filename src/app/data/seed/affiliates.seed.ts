import { Affiliate } from '../models/affiliate';

/**
 * Afiliados de la demo.
 *
 * Lucía Vega es la protagonista y su perfil está calibrado para que el
 * recorrido documentado funcione: es elegible en Landing Pro, tiene una
 * solicitud en revisión y le falta un requisito en la campaña Premium.
 *
 * El resto pobla el descubrimiento de afiliados de la organización y las
 * tablas de conversiones.
 */
export const AFFILIATES: readonly Affiliate[] = [
  {
    id: 'lucia-vega',
    slug: 'lucia-vega',
    name: 'Lucía Vega',
    headline: 'Creadora y consultora de marketing para negocios de servicios',
    bio:
      'Ayudo a estudios, consultoras y profesionales independientes a explicar mejor lo que ' +
      'venden. Publico casos reales, plantillas y análisis de campañas; mi audiencia son ' +
      'personas que facturan por su cuenta y necesitan decidir en qué invertir.',
    initials: 'LV',
    type: 'creator',
    location: 'Lima, Perú',
    country: 'PE',

    level: 'pro',
    relayScore: 84,
    scoreBreakdown: { performance: 34, experience: 20, profile: 18, consistency: 12 },
    levelProgress: 72,
    profileCompleteness: 92,

    niches: ['marketing', 'diseno', 'negocios', 'productividad', 'herramientas'],
    channels: [
      { id: 'instagram', handle: '@luciavega.co', audience: 24800 },
      { id: 'youtube', handle: 'Lucía Vega', audience: 8400 },
      { id: 'newsletter', handle: 'Cuenta Clara', audience: 3100 },
    ],
    badges: ['verified', 'complete-profile', 'top-performer'],
    available: true,

    portfolio: [
      {
        campaignName: 'Workspace Plus',
        organizationName: 'Fluxa',
        conversions: 11,
        conversionRate: 2.1,
      },
      {
        campaignName: 'Growth Bootcamp',
        organizationName: 'Impulso Academy',
        conversions: 6,
        conversionRate: 1.8,
      },
    ],
    experience: [
      { categoryId: 'marketing', campaigns: 3, conversions: 14 },
      { categoryId: 'tecnologia', campaigns: 2, conversions: 11 },
      { categoryId: 'educacion', campaigns: 1, conversions: 6 },
      { categoryId: 'productividad', campaigns: 1, conversions: 4 },
    ],
    averageConversionRate: 1.45,

    visibility: {
      audience: true,
      results: true,
      availability: true,
      channels: true,
      relayScore: true,
    },
    joinedAt: '2025-09-14',
  },
  {
    id: 'mateo-rios',
    slug: 'mateo-rios',
    name: 'Mateo Ríos',
    headline: 'Newsletter semanal sobre herramientas para trabajar mejor',
    bio:
      'Escribo cada martes sobre una herramienta que he probado durante un mes. Sin listas de ' +
      'veinte apps: una sola, con lo que funciona y lo que no.',
    initials: 'MR',
    type: 'publisher',
    location: 'Lima, Perú',
    country: 'PE',

    level: 'rising',
    relayScore: 68,
    scoreBreakdown: { performance: 24, experience: 15, profile: 17, consistency: 12 },
    levelProgress: 41,
    profileCompleteness: 78,

    niches: ['productividad', 'herramientas', 'tecnologia'],
    channels: [
      { id: 'newsletter', handle: 'Martes Útil', audience: 9600 },
      { id: 'linkedin', handle: 'Mateo Ríos', audience: 4200 },
    ],
    badges: ['complete-profile'],
    available: true,

    portfolio: [
      {
        campaignName: 'Workspace Plus',
        organizationName: 'Fluxa',
        conversions: 8,
        conversionRate: 1.9,
      },
    ],
    experience: [
      { categoryId: 'tecnologia', campaigns: 2, conversions: 9 },
      { categoryId: 'productividad', campaigns: 1, conversions: 3 },
    ],
    averageConversionRate: 1.62,

    visibility: {
      audience: true,
      results: true,
      availability: true,
      channels: true,
      relayScore: true,
    },
    joinedAt: '2026-01-08',
  },
  {
    id: 'ana-paredes',
    slug: 'ana-paredes',
    name: 'Ana Paredes',
    headline: 'Diseñadora que enseña marca a profesionales independientes',
    bio:
      'Formé mi estudio hace seis años y desde 2024 comparto el proceso completo: cómo cotizo, ' +
      'cómo presento y qué herramientas uso. Mi audiencia es mayoritariamente de servicios.',
    initials: 'AP',
    type: 'professional',
    location: 'Lima, Perú',
    country: 'PE',

    level: 'pro',
    relayScore: 81,
    scoreBreakdown: { performance: 31, experience: 21, profile: 17, consistency: 12 },
    levelProgress: 58,
    profileCompleteness: 88,

    niches: ['diseno', 'marketing', 'negocios'],
    channels: [
      { id: 'instagram', handle: '@anaparedes.studio', audience: 18200 },
      { id: 'youtube', handle: 'Ana Paredes', audience: 6100 },
    ],
    badges: ['verified', 'recurring'],
    available: true,

    portfolio: [
      {
        campaignName: 'Landing Pro',
        organizationName: 'Norte Digital',
        conversions: 5,
        conversionRate: 1.6,
      },
    ],
    experience: [
      { categoryId: 'servicios', campaigns: 2, conversions: 7 },
      { categoryId: 'marketing', campaigns: 2, conversions: 8 },
    ],
    averageConversionRate: 1.54,

    visibility: {
      audience: true,
      results: true,
      availability: true,
      channels: true,
      relayScore: false,
    },
    joinedAt: '2025-10-21',
  },
  {
    id: 'carlos-ibanez',
    slug: 'carlos-ibanez',
    name: 'Carlos Ibáñez',
    headline: 'Comunidad de fundadores B2B en Latinoamérica',
    bio:
      'Coordino una comunidad de 2.400 fundadores de empresas de servicios y software. ' +
      'Organizamos sesiones mensuales y un canal de recomendaciones de proveedores.',
    initials: 'CI',
    type: 'community',
    location: 'Lima, Perú',
    country: 'PE',

    level: 'elite',
    relayScore: 91,
    scoreBreakdown: { performance: 37, experience: 24, profile: 19, consistency: 11 },
    levelProgress: 100,
    profileCompleteness: 96,

    niches: ['negocios', 'finanzas', 'tecnologia'],
    channels: [
      { id: 'comunidad', handle: 'Fundadores LatAm', audience: 2400 },
      { id: 'linkedin', handle: 'Carlos Ibáñez', audience: 31500 },
      { id: 'newsletter', handle: 'Sala de Juntas', audience: 5800 },
    ],
    badges: ['verified', 'top-performer', 'fast-response'],
    available: false,

    portfolio: [
      {
        campaignName: 'Revenue Systems',
        organizationName: 'Órbita Advisory',
        conversions: 4,
        conversionRate: 3.2,
      },
    ],
    experience: [
      { categoryId: 'servicios', campaigns: 3, conversions: 12 },
      { categoryId: 'finanzas', campaigns: 1, conversions: 5 },
    ],
    averageConversionRate: 2.8,

    visibility: {
      audience: true,
      results: true,
      availability: true,
      channels: true,
      relayScore: true,
    },
    joinedAt: '2025-05-19',
  },
  {
    id: 'sofia-quiroz',
    slug: 'sofia-quiroz',
    name: 'Sofía Quiroz',
    headline: 'Contenido corto sobre estudiar y aprender mejor',
    bio:
      'Publico rutinas de estudio, reseñas de programas formativos y entrevistas con personas ' +
      'que cambiaron de carrera. Audiencia joven y muy activa.',
    initials: 'SQ',
    type: 'creator',
    location: 'Lima, Perú',
    country: 'PE',

    level: 'starter',
    relayScore: 52,
    scoreBreakdown: { performance: 16, experience: 9, profile: 16, consistency: 11 },
    levelProgress: 34,
    profileCompleteness: 64,

    niches: ['educacion', 'productividad'],
    channels: [
      { id: 'tiktok', handle: '@sofiquiroz', audience: 41000 },
      { id: 'instagram', handle: '@sofiquiroz', audience: 12300 },
    ],
    badges: [],
    available: true,

    portfolio: [],
    experience: [{ categoryId: 'educacion', campaigns: 1, conversions: 2 }],
    averageConversionRate: 0.9,

    visibility: {
      audience: true,
      results: false,
      availability: true,
      channels: true,
      relayScore: false,
    },
    joinedAt: '2026-05-30',
  },
];

/** Perfil de afiliado de la cuenta demo. */
export const DEMO_AFFILIATE_ID = 'lucia-vega';
