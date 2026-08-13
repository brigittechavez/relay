import { Organization } from '../models/organization';

/**
 * Organizaciones de la demo.
 *
 * Norte Digital es la protagonista: es el contexto de la demo de empresa y la
 * dueña de Landing Pro. El resto existe para que el marketplace tenga variedad
 * real de categorías, modalidades de acceso y modelos de comisión.
 */
export const ORGANIZATIONS: readonly Organization[] = [
  {
    id: 'norte-digital',
    slug: 'norte-digital',
    name: 'Norte Digital',
    initials: 'ND',
    kind: 'studio',
    categoryId: 'servicios',
    tagline: 'Estudio de desarrollo web para negocios y especialistas',
    description:
      'Estudio limeño especializado en sitios y landings que convierten. Trabajamos con ' +
      'consultores, clínicas, academias y estudios profesionales que necesitan una presencia ' +
      'digital que sostenga su tarifa. Cada proyecto se entrega en tres semanas con analítica ' +
      'configurada y una sesión de traspaso.',
    location: 'Lima, Perú',
    country: 'PE',
    website: 'nortedigital.pe',
    plan: 'growth',
    trustSignals: ['verified', 'on-time-payment', 'fast-response'],
    metrics: {
      activeAffiliates: 12,
      averageReviewDays: 1.8,
      approvalRate: 38,
      completedCampaigns: 7,
    },
    team: [
      {
        id: 'tm-1',
        name: 'Lucía Vega',
        email: 'lucia@nortedigital.pe',
        initials: 'LV',
        role: 'owner',
        status: 'active',
        joinedAt: '2025-11-04',
      },
      {
        id: 'tm-2',
        name: 'Diego Salas',
        email: 'diego@nortedigital.pe',
        initials: 'DS',
        role: 'member',
        status: 'active',
        joinedAt: '2026-01-19',
      },
      {
        id: 'tm-3',
        name: 'Renata Chau',
        email: 'renata@nortedigital.pe',
        initials: 'RC',
        role: 'member',
        status: 'invited',
        joinedAt: '2026-08-02',
      },
    ],
    createdAt: '2025-11-04',
  },
  {
    id: 'fluxa',
    slug: 'fluxa',
    name: 'Fluxa',
    initials: 'FX',
    kind: 'company',
    categoryId: 'tecnologia',
    tagline: 'Espacio de trabajo para equipos pequeños',
    description:
      'Herramienta de gestión de trabajo pensada para equipos de entre tres y quince personas. ' +
      'Sustituye la mezcla de hojas de cálculo, chats y tableros sueltos por un solo lugar.',
    location: 'Lima, Perú',
    country: 'PE',
    website: 'fluxa.app',
    plan: 'scale',
    trustSignals: ['verified', 'on-time-payment'],
    metrics: {
      activeAffiliates: 48,
      averageReviewDays: 0.2,
      approvalRate: 94,
      completedCampaigns: 3,
    },
    team: [],
    createdAt: '2025-06-12',
  },
  {
    id: 'impulso-academy',
    slug: 'impulso-academy',
    name: 'Impulso Academy',
    initials: 'IA',
    kind: 'academy',
    categoryId: 'educacion',
    tagline: 'Formación práctica en crecimiento y marketing',
    description:
      'Academia con programas intensivos de adquisición, contenido y analítica. Las cohortes son ' +
      'de veinte personas y cada participante sale con un plan de crecimiento aplicado a su ' +
      'propio negocio.',
    location: 'Lima, Perú',
    country: 'PE',
    website: 'impulsoacademy.pe',
    plan: 'growth',
    trustSignals: ['verified', 'fast-response'],
    metrics: {
      activeAffiliates: 21,
      averageReviewDays: 2.4,
      approvalRate: 52,
      completedCampaigns: 5,
    },
    team: [],
    createdAt: '2025-08-27',
  },
  {
    id: 'marea-creative',
    slug: 'marea-creative',
    name: 'Marea Creative',
    initials: 'MC',
    kind: 'agency',
    categoryId: 'marketing',
    tagline: 'Identidad visual para negocios en crecimiento',
    description:
      'Estudio de diseño que trabaja por sprints cerrados: dos semanas, un entregable y un ' +
      'manual de uso. Sin retainers ni proyectos que se alargan.',
    location: 'Arequipa, Perú',
    country: 'PE',
    website: 'mareacreative.pe',
    plan: 'starter',
    trustSignals: ['on-time-payment'],
    metrics: {
      activeAffiliates: 7,
      averageReviewDays: 3.1,
      approvalRate: 44,
      completedCampaigns: 2,
    },
    team: [],
    createdAt: '2026-01-15',
  },
  {
    id: 'orbita-advisory',
    slug: 'orbita-advisory',
    name: 'Órbita Advisory',
    initials: 'OA',
    kind: 'company',
    categoryId: 'servicios',
    tagline: 'Sistemas de ingresos para empresas B2B',
    description:
      'Consultoría que diseña e implanta el proceso comercial completo: segmentación, oferta, ' +
      'canal y medición. Trabajamos con empresas que ya facturan y quieren ordenar el ' +
      'crecimiento.',
    location: 'Lima, Perú',
    country: 'PE',
    website: 'orbitaadvisory.com',
    plan: 'scale',
    trustSignals: ['verified', 'on-time-payment'],
    metrics: {
      activeAffiliates: 4,
      averageReviewDays: 4.5,
      approvalRate: 18,
      completedCampaigns: 3,
    },
    team: [],
    createdAt: '2025-09-30',
  },
  {
    id: 'circulo-pro',
    slug: 'circulo-pro',
    name: 'Círculo Pro',
    initials: 'CP',
    kind: 'brand',
    categoryId: 'membresias',
    tagline: 'Comunidad de profesionales independientes',
    description:
      'Membresía mensual con sesiones en directo, plantillas de propuestas y una bolsa de ' +
      'encargos entre miembros. Enfocada en quien factura por su cuenta.',
    location: 'Lima, Perú',
    country: 'PE',
    website: 'circulopro.pe',
    plan: 'growth',
    trustSignals: ['verified', 'fast-response'],
    metrics: {
      activeAffiliates: 33,
      averageReviewDays: 0.4,
      approvalRate: 88,
      completedCampaigns: 4,
    },
    team: [],
    createdAt: '2025-07-08',
  },
  {
    id: 'punto-norte',
    slug: 'punto-norte',
    name: 'Punto Norte',
    initials: 'PN',
    kind: 'independent',
    categoryId: 'servicios',
    tagline: 'Estrategia de marca para especialistas',
    description:
      'Consultoría individual para profesionales que quieren dejar de competir por precio: ' +
      'posicionamiento, oferta y mensaje en un proceso de cuatro semanas.',
    location: 'Trujillo, Perú',
    country: 'PE',
    website: 'puntonorte.pe',
    plan: 'starter',
    trustSignals: ['on-time-payment', 'fast-response'],
    metrics: {
      activeAffiliates: 6,
      averageReviewDays: 2.0,
      approvalRate: 47,
      completedCampaigns: 2,
    },
    team: [],
    createdAt: '2026-02-11',
  },
  {
    id: 'raiz-contable',
    slug: 'raiz-contable',
    name: 'Raíz Contable',
    initials: 'RC',
    kind: 'service',
    categoryId: 'finanzas',
    tagline: 'Contabilidad para negocios digitales',
    description:
      'Servicio contable mensual para negocios que facturan online: declaraciones, libros y un ' +
      'informe trimestral que se entiende sin ser contador.',
    location: 'Lima, Perú',
    country: 'PE',
    website: 'raizcontable.pe',
    plan: 'starter',
    trustSignals: ['verified'],
    metrics: {
      activeAffiliates: 9,
      averageReviewDays: 1.2,
      approvalRate: 71,
      completedCampaigns: 1,
    },
    team: [],
    createdAt: '2026-03-22',
  },
  {
    id: 'vital-lab',
    slug: 'vital-lab',
    name: 'Vital Lab',
    initials: 'VL',
    kind: 'company',
    categoryId: 'salud',
    tagline: 'Programas de nutrición con seguimiento',
    description:
      'Planes de doce semanas con nutricionista asignada y revisiones quincenales. Sin ' +
      'suplementos ni dietas cerradas.',
    location: 'Lima, Perú',
    country: 'PE',
    website: 'vitallab.pe',
    plan: 'growth',
    trustSignals: ['verified', 'on-time-payment'],
    metrics: {
      activeAffiliates: 15,
      averageReviewDays: 1.0,
      approvalRate: 63,
      completedCampaigns: 2,
    },
    team: [],
    createdAt: '2025-12-05',
  },
];
