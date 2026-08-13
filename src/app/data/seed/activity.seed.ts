import { Application } from '../models/application';
import { Notification, TimelineEvent } from '../models/notification';
import { Conversion, Partnership, Payout, PromoCode, ReferralLink } from '../models/tracking';
import { ChannelId } from '../models/taxonomy';
import { demoDate } from './demo-clock';

/**
 * Actividad de la demo.
 *
 * Está construida para que ninguna cifra sea decorativa: las conversiones son
 * la fuente de la que salen los KPIs, los balances y los payouts, de modo que
 * lo que muestra el panel siempre cuadra con lo que muestra la tabla.
 *
 * Lucía Vega **no** empieza unida a Landing Pro: ese es el recorrido que la
 * demo deja completar (solicitar → aprobación → link → código → rendimiento).
 * La campaña ya tiene actividad de otros afiliados, así que la organización
 * tiene datos desde el primer momento.
 */

export const PARTNERSHIPS: readonly Partnership[] = [
  {
    id: 'ptn-1',
    campaignId: 'workspace-plus',
    affiliateId: 'lucia-vega',
    organizationId: 'fluxa',
    status: 'active',
    joinedAt: demoDate(-186),
  },
  {
    id: 'ptn-2',
    campaignId: 'membresia-profesional',
    affiliateId: 'lucia-vega',
    organizationId: 'circulo-pro',
    status: 'active',
    joinedAt: demoDate(-124),
  },
  {
    id: 'ptn-3',
    campaignId: 'estrategia-de-marca',
    affiliateId: 'lucia-vega',
    organizationId: 'punto-norte',
    status: 'active',
    joinedAt: demoDate(-71),
  },
  {
    id: 'ptn-4',
    campaignId: 'growth-bootcamp',
    affiliateId: 'lucia-vega',
    organizationId: 'impulso-academy',
    status: 'ended',
    statusNote: 'La cohorte de mayo cerró inscripciones',
    joinedAt: demoDate(-240),
    endedAt: demoDate(-96),
  },
  {
    id: 'ptn-5',
    campaignId: 'landing-pro',
    affiliateId: 'ana-paredes',
    organizationId: 'norte-digital',
    status: 'active',
    joinedAt: demoDate(-97),
  },
  {
    id: 'ptn-6',
    campaignId: 'landing-pro',
    affiliateId: 'mateo-rios',
    organizationId: 'norte-digital',
    status: 'paused',
    statusNote: 'Pausa acordada durante agosto',
    joinedAt: demoDate(-142),
  },
  {
    id: 'ptn-7',
    campaignId: 'workspace-plus',
    affiliateId: 'mateo-rios',
    organizationId: 'fluxa',
    status: 'active',
    joinedAt: demoDate(-160),
  },
  {
    id: 'ptn-8',
    campaignId: 'revenue-systems',
    affiliateId: 'carlos-ibanez',
    organizationId: 'orbita-advisory',
    status: 'active',
    joinedAt: demoDate(-210),
  },
];

export const APPLICATIONS: readonly Application[] = [
  // --- Lucía ---------------------------------------------------------------
  {
    id: 'app-1',
    campaignId: 'growth-bootcamp',
    affiliateId: 'lucia-vega',
    organizationId: 'impulso-academy',
    status: 'under-review',
    strategy:
      'Mi audiencia son profesionales que ya facturan y quieren ordenar cómo consiguen ' +
      'clientes. Empezaría por la newsletter con un caso propio y luego una sesión de ' +
      'preguntas en directo antes del cierre de la cohorte.',
    channels: ['newsletter', 'instagram'],
    matchScore: 90,
    submittedAt: demoDate(-4),
    createdAt: demoDate(-4),
  },
  {
    id: 'app-2',
    campaignId: 'estrategia-de-marca',
    affiliateId: 'lucia-vega',
    organizationId: 'punto-norte',
    status: 'approved',
    strategy:
      'Lo presentaría con la pregunta que más me repiten: cómo subir tarifa sin perder ' +
      'clientes. Instagram primero, newsletter después.',
    channels: ['instagram', 'newsletter'],
    matchScore: 86,
    submittedAt: demoDate(-74),
    decidedAt: demoDate(-71),
    createdAt: demoDate(-74),
  },

  // --- Norte Digital: tres solicitudes por revisar --------------------------
  {
    id: 'app-3',
    campaignId: 'landing-pro',
    affiliateId: 'carlos-ibanez',
    organizationId: 'norte-digital',
    status: 'submitted',
    strategy:
      'Tengo una comunidad de 2.400 fundadores en la que circulan recomendaciones de ' +
      'proveedores cada semana. Publicaría un caso concreto y abriría un hilo de preguntas ' +
      'con el equipo de Norte Digital.',
    channels: ['comunidad', 'linkedin', 'newsletter'],
    matchScore: 71,
    submittedAt: demoDate(-2),
    createdAt: demoDate(-2),
  },
  {
    id: 'app-4',
    campaignId: 'landing-pro',
    affiliateId: 'mateo-rios',
    organizationId: 'norte-digital',
    status: 'under-review',
    strategy:
      'Un envío monográfico en la newsletter comparando hacerlo uno mismo frente a ' +
      'encargarlo, con el coste real de cada opción.',
    channels: ['newsletter'],
    matchScore: 64,
    submittedAt: demoDate(-6),
    createdAt: demoDate(-6),
  },
  {
    id: 'app-5',
    campaignId: 'landing-pro',
    affiliateId: 'sofia-quiroz',
    organizationId: 'norte-digital',
    status: 'submitted',
    strategy: 'Haría un vídeo corto mostrando webs antes y después.',
    channels: ['tiktok', 'instagram'],
    matchScore: 41,
    submittedAt: demoDate(-1),
    createdAt: demoDate(-1),
  },

  // --- Histórico ------------------------------------------------------------
  {
    id: 'app-6',
    campaignId: 'landing-pro',
    affiliateId: 'ana-paredes',
    organizationId: 'norte-digital',
    status: 'approved',
    strategy:
      'Mi audiencia es de diseñadores y consultores que ya venden. Presentaría Landing Pro ' +
      'como el paso que ellos no quieren hacer a mano.',
    channels: ['instagram', 'youtube'],
    matchScore: 82,
    submittedAt: demoDate(-100),
    decidedAt: demoDate(-97),
    createdAt: demoDate(-100),
  },
  {
    id: 'app-7',
    campaignId: 'revenue-systems',
    affiliateId: 'ana-paredes',
    organizationId: 'orbita-advisory',
    status: 'rejected',
    strategy: 'Publicaría un caso en Instagram y YouTube.',
    channels: ['instagram', 'youtube'],
    matchScore: 58,
    decisionNote: 'Buscamos canales orientados a decisores B2B',
    submittedAt: demoDate(-58),
    decidedAt: demoDate(-53),
    createdAt: demoDate(-58),
  },
];

/**
 * Actividad simulada que se asigna a un link nuevo según su canal.
 *
 * Cuando el afiliado crea un link, RELAY no puede medir tráfico real: le
 * atribuye el rendimiento típico de ese canal en la campaña. Los valores son
 * los del escenario documentado de Landing Pro.
 */
export const SIMULATED_LINK_ACTIVITY: Record<ChannelId, { clicks: number; conversions: number }> = {
  instagram: { clicks: 540, conversions: 9 },
  youtube: { clicks: 280, conversions: 4 },
  newsletter: { clicks: 170, conversions: 3 },
  tiktok: { clicks: 610, conversions: 5 },
  linkedin: { clicks: 190, conversions: 4 },
  blog: { clicks: 230, conversions: 3 },
  podcast: { clicks: 120, conversions: 2 },
  comunidad: { clicks: 160, conversions: 4 },
};

export const REFERRAL_LINKS: readonly ReferralLink[] = [
  {
    id: 'lnk-1',
    campaignId: 'estrategia-de-marca',
    affiliateId: 'lucia-vega',
    name: 'Hilo tarifas',
    channel: 'instagram',
    slug: 'lucia-tarifas',
    active: true,
    clicks: 240,
    conversions: 6,
    commission: 1500,
    createdAt: demoDate(-68),
  },
  {
    id: 'lnk-2',
    campaignId: 'estrategia-de-marca',
    affiliateId: 'lucia-vega',
    name: 'Newsletter agosto',
    channel: 'newsletter',
    slug: 'lucia-news-ago',
    active: true,
    clicks: 140,
    conversions: 3,
    commission: 750,
    createdAt: demoDate(-19),
  },
  {
    id: 'lnk-3',
    campaignId: 'membresia-profesional',
    affiliateId: 'lucia-vega',
    name: 'Reel comunidad',
    channel: 'instagram',
    slug: 'lucia-circulo',
    active: true,
    clicks: 300,
    conversions: 4,
    commission: 267,
    createdAt: demoDate(-110),
  },
  {
    id: 'lnk-4',
    campaignId: 'workspace-plus',
    affiliateId: 'lucia-vega',
    name: 'Review de herramientas',
    channel: 'youtube',
    slug: 'lucia-fluxa',
    active: true,
    clicks: 560,
    conversions: 5,
    commission: 207,
    createdAt: demoDate(-170),
  },
  {
    id: 'lnk-5',
    campaignId: 'landing-pro',
    affiliateId: 'ana-paredes',
    name: 'Caso de estudio',
    channel: 'instagram',
    slug: 'ana-caso',
    active: true,
    clicks: 420,
    conversions: 7,
    commission: 2100,
    createdAt: demoDate(-90),
  },
  {
    id: 'lnk-6',
    campaignId: 'landing-pro',
    affiliateId: 'mateo-rios',
    name: 'Envío monográfico',
    channel: 'newsletter',
    slug: 'mateo-landing',
    active: false,
    clicks: 260,
    conversions: 3,
    commission: 900,
    createdAt: demoDate(-130),
  },
];

export const PROMO_CODES: readonly PromoCode[] = [
  {
    id: 'code-1',
    campaignId: 'membresia-profesional',
    affiliateId: 'lucia-vega',
    code: 'LUCIA25',
    benefit: '25% de descuento el primer mes',
    active: true,
    conversions: 2,
  },
  {
    id: 'code-2',
    campaignId: 'estrategia-de-marca',
    affiliateId: 'lucia-vega',
    code: 'LUCIA250',
    benefit: 'S/ 250 de descuento en la consultoría',
    active: true,
    conversions: 3,
  },
  {
    id: 'code-3',
    campaignId: 'landing-pro',
    affiliateId: 'ana-paredes',
    code: 'ANA20',
    benefit: '20% de descuento en la primera landing',
    active: true,
    conversions: 4,
  },
];

/**
 * Conversiones.
 *
 * Los KPIs del panel de Lucía se calculan sobre estas filas: 18 conversiones y
 * 1.240 clics en los últimos 30 días, con una tasa del 1,45%.
 */
export const CONVERSIONS: readonly Conversion[] = [
  ...buildConversions({
    prefix: 'CV-11',
    campaignId: 'estrategia-de-marca',
    affiliateId: 'lucia-vega',
    organizationId: 'punto-norte',
    linkId: 'lnk-1',
    channel: 'instagram',
    value: 2100,
    commission: 250,
    entries: [
      { day: -3, status: 'validating' },
      { day: -6, status: 'approved' },
      { day: -9, status: 'approved' },
      { day: -12, status: 'scheduled' },
      { day: -16, status: 'paid' },
      { day: -19, status: 'paid' },
      { day: -23, status: 'paid' },
      { day: -26, status: 'paid' },
      { day: -29, status: 'paid' },
    ],
  }),
  ...buildConversions({
    prefix: 'CV-12',
    campaignId: 'membresia-profesional',
    affiliateId: 'lucia-vega',
    organizationId: 'circulo-pro',
    linkId: 'lnk-3',
    channel: 'instagram',
    value: 89,
    commission: 66.75,
    entries: [
      { day: -2, status: 'registered' },
      { day: -8, status: 'approved' },
      { day: -14, status: 'paid' },
      { day: -21, status: 'paid' },
    ],
  }),
  ...buildConversions({
    prefix: 'CV-13',
    campaignId: 'workspace-plus',
    affiliateId: 'lucia-vega',
    organizationId: 'fluxa',
    linkId: 'lnk-4',
    channel: 'youtube',
    value: 69,
    commission: 41.4,
    entries: [
      { day: -5, status: 'approved' },
      { day: -11, status: 'paid' },
      { day: -18, status: 'paid' },
      { day: -24, status: 'paid' },
      { day: -28, status: 'paid' },
    ],
  }),

  // Actividad de Landing Pro previa a la entrada de Lucía: es lo que da datos
  // al panel de Norte Digital desde el primer momento.
  ...buildConversions({
    prefix: 'CV-14',
    campaignId: 'landing-pro',
    affiliateId: 'ana-paredes',
    organizationId: 'norte-digital',
    linkId: 'lnk-5',
    channel: 'instagram',
    value: 2500,
    commission: 300,
    entries: [
      { day: -1, status: 'validating' },
      { day: -4, status: 'validating' },
      { day: -7, status: 'approved' },
      { day: -13, status: 'approved' },
      { day: -20, status: 'paid' },
      { day: -34, status: 'paid' },
      { day: -48, status: 'paid' },
    ],
  }),
  ...buildConversions({
    prefix: 'CV-15',
    campaignId: 'landing-pro',
    affiliateId: 'mateo-rios',
    organizationId: 'norte-digital',
    linkId: 'lnk-6',
    channel: 'newsletter',
    value: 2500,
    commission: 300,
    entries: [
      { day: -10, status: 'refunded' },
      { day: -41, status: 'paid' },
      { day: -62, status: 'paid' },
    ],
  }),
  ...buildConversions({
    prefix: 'CV-16',
    campaignId: 'revenue-systems',
    affiliateId: 'carlos-ibanez',
    organizationId: 'orbita-advisory',
    channel: 'linkedin',
    value: 4500,
    commission: 600,
    entries: [
      { day: -15, status: 'approved' },
      { day: -52, status: 'paid' },
    ],
  }),
];

export const PAYOUTS: readonly Payout[] = [
  {
    id: 'pay-1',
    affiliateId: 'lucia-vega',
    amount: 1483.4,
    status: 'paid',
    conversionIds: [],
    periodLabel: 'Julio 2026',
    paidAt: demoDate(-13),
  },
  {
    id: 'pay-2',
    affiliateId: 'lucia-vega',
    amount: 250,
    status: 'scheduled',
    conversionIds: ['CV-11-4'],
    periodLabel: 'Agosto 2026',
    expectedAt: demoDate(18),
  },
];

export const NOTIFICATIONS: readonly Notification[] = [
  {
    id: 'ntf-1',
    kind: 'application-received',
    audience: 'norte-digital',
    title: '3 solicitudes esperan revisión',
    body: 'Carlos Ibáñez, Mateo Ríos y Sofía Quiroz han solicitado unirse a Landing Pro.',
    link: '/app/organization/norte-digital/campanas/landing-pro/aplicaciones',
    read: false,
    createdAt: demoDate(-1),
  },
  {
    id: 'ntf-2',
    kind: 'conversion-review',
    audience: 'norte-digital',
    title: '2 conversiones requieren validación',
    body: 'Dos clientes cerrados de Landing Pro llevan más de 24 horas en validación.',
    link: '/app/organization/norte-digital/conversiones',
    read: false,
    createdAt: demoDate(-1),
  },
  {
    id: 'ntf-3',
    kind: 'goal',
    audience: 'norte-digital',
    title: 'Ana Paredes alcanzó el bono de Landing Pro',
    body: 'Cinco conversiones aprobadas: se ha añadido el bono de S/ 500 a sus comisiones.',
    link: '/app/organization/norte-digital/comisiones',
    read: true,
    createdAt: demoDate(-13),
  },
  {
    id: 'ntf-4',
    kind: 'campaign-updated',
    audience: 'norte-digital',
    title: 'Landing Pro mantiene el mejor rendimiento del mes',
    body: '1,62% de conversión frente al 1,21% del mes anterior.',
    link: '/app/organization/norte-digital/campanas/landing-pro/resumen',
    read: true,
    createdAt: demoDate(-5),
  },
  {
    id: 'ntf-5',
    kind: 'application-received',
    audience: 'affiliate',
    title: 'Tu solicitud a Growth Bootcamp está en revisión',
    body: 'Impulso Academy suele responder en 2,4 días.',
    link: '/app/affiliate/aplicaciones/app-1',
    read: false,
    createdAt: demoDate(-4),
  },
  {
    id: 'ntf-6',
    kind: 'commission-approved',
    audience: 'affiliate',
    title: 'Tu comisión de S/ 250 fue aprobada',
    body: 'Corresponde a una contratación de Estrategia de Marca del 4 de agosto.',
    link: '/app/affiliate/ganancias',
    read: false,
    createdAt: demoDate(-6),
  },
  {
    id: 'ntf-7',
    kind: 'campaign-ending',
    audience: 'affiliate',
    title: 'Kit de Lanzamiento termina en 33 días',
    body: 'Es una campaña con fecha de cierre: después no se generan comisiones nuevas.',
    link: '/campanas/kit-de-lanzamiento',
    read: true,
    createdAt: demoDate(-8),
  },
  {
    id: 'ntf-8',
    kind: 'conversion',
    audience: 'affiliate',
    title: 'Tu link «Hilo tarifas» lidera esta semana',
    body: '240 clics y 6 conversiones desde que lo publicaste.',
    link: '/app/affiliate/links',
    read: true,
    createdAt: demoDate(-9),
  },
  {
    id: 'ntf-9',
    kind: 'campaign-updated',
    audience: 'affiliate',
    title: 'Revenue Systems requiere experiencia B2B',
    body: 'Es el único requisito obligatorio que te falta para poder solicitar.',
    link: '/campanas/revenue-systems',
    read: true,
    createdAt: demoDate(-12),
  },
];

export const TIMELINE: readonly TimelineEvent[] = [
  {
    id: 'tl-1',
    campaignId: 'landing-pro',
    affiliateId: 'sofia-quiroz',
    label: 'Nueva solicitud',
    detail: 'Sofía Quiroz · match 41%',
    tone: 'neutral',
    occurredAt: demoDate(-1),
  },
  {
    id: 'tl-2',
    campaignId: 'landing-pro',
    affiliateId: 'ana-paredes',
    label: 'Conversión registrada',
    detail: 'Cliente cerrado · S/ 2,500',
    tone: 'success',
    occurredAt: demoDate(-1),
  },
  {
    id: 'tl-3',
    campaignId: 'landing-pro',
    affiliateId: 'carlos-ibanez',
    label: 'Nueva solicitud',
    detail: 'Carlos Ibáñez · match 71%',
    tone: 'neutral',
    occurredAt: demoDate(-2),
  },
  {
    id: 'tl-4',
    campaignId: 'landing-pro',
    affiliateId: 'mateo-rios',
    label: 'Conversión reembolsada',
    detail: 'El cliente canceló dentro del plazo de garantía',
    tone: 'danger',
    occurredAt: demoDate(-10),
  },
  {
    id: 'tl-5',
    campaignId: 'landing-pro',
    affiliateId: 'ana-paredes',
    label: 'Bono alcanzado',
    detail: 'Cinco conversiones aprobadas · S/ 500',
    tone: 'success',
    occurredAt: demoDate(-13),
  },
  {
    id: 'tl-6',
    campaignId: 'estrategia-de-marca',
    affiliateId: 'lucia-vega',
    label: 'Comisión aprobada',
    detail: 'S/ 250',
    tone: 'success',
    occurredAt: demoDate(-6),
  },
  {
    id: 'tl-7',
    campaignId: 'estrategia-de-marca',
    affiliateId: 'lucia-vega',
    label: 'Link creado',
    detail: 'Newsletter agosto',
    tone: 'neutral',
    occurredAt: demoDate(-19),
  },
];

interface ConversionEntry {
  readonly day: number;
  readonly status: Conversion['status'];
}

function buildConversions(spec: {
  prefix: string;
  campaignId: string;
  affiliateId: string;
  organizationId: string;
  channel: Conversion['channel'];
  value: number;
  commission: number;
  linkId?: string;
  entries: readonly ConversionEntry[];
}): Conversion[] {
  return spec.entries.map((entry, index) => ({
    id: `${spec.prefix}-${index + 1}`,
    campaignId: spec.campaignId,
    affiliateId: spec.affiliateId,
    organizationId: spec.organizationId,
    linkId: spec.linkId,
    channel: spec.channel,
    value: spec.value,
    // Una conversión reembolsada no genera comisión.
    commission: entry.status === 'refunded' || entry.status === 'rejected' ? 0 : spec.commission,
    status: entry.status,
    occurredAt: demoDate(entry.day),
  }));
}
