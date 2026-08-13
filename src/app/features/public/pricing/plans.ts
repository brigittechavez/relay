import { OrganizationPlan } from '@data/models/organization';

export interface Plan {
  readonly id: OrganizationPlan;
  readonly name: string;
  readonly audience: string;
  readonly price: string;
  readonly priceNote: string;
  readonly summary: string;
  readonly features: readonly string[];
  readonly limits: readonly string[];
  readonly highlighted: boolean;
}

/**
 * Planes de organización.
 *
 * Son parte del producto ficticio y no hay facturación detrás: RELAY no
 * integra pasarela de pago ni gestiona suscripciones. Los planes existen
 * porque el modelo de negocio forma parte de lo que el proyecto explica, y el
 * gating que producen en la interfaz es informativo, no bloqueante.
 */
export const PLANS: readonly Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    audience: 'Profesionales independientes y negocios que empiezan',
    price: 'Gratis',
    priceNote: 'Sin límite de tiempo',
    summary: 'Publica una campaña y valida si la afiliación funciona para tu oferta.',
    features: [
      '1 campaña activa',
      'Modalidad abierta o selectiva',
      'Hasta 10 afiliados activos',
      'Conversiones y comisiones',
      'Exportación CSV',
    ],
    limits: ['Sin campañas premium', 'Sin equipo'],
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    audience: 'Estudios, academias y empresas con programa en marcha',
    price: 'S/ 149',
    priceNote: 'al mes',
    summary: 'Varias campañas a la vez y las herramientas para elegir con quién trabajas.',
    features: [
      'Hasta 5 campañas activas',
      'Las tres modalidades, incluida premium',
      'Afiliados ilimitados',
      'Descubrimiento e invitaciones',
      'Analítica por campaña y por canal',
      'Equipo de hasta 5 personas',
    ],
    limits: [],
    highlighted: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    audience: 'Empresas con afiliación como canal principal',
    price: 'S/ 399',
    priceNote: 'al mes',
    summary: 'Sin límites de campaña y con la operación de comisiones al completo.',
    features: [
      'Campañas ilimitadas',
      'Bonos por meta y comisiones escalonadas',
      'Prioridad en el descubrimiento',
      'Equipo ilimitado',
      'Histórico completo de conversiones',
    ],
    limits: [],
    highlighted: false,
  },
];

/** Lo que un afiliado obtiene. En RELAY siempre es gratuito. */
export const AFFILIATE_PLAN = {
  name: 'Afiliados',
  price: 'Gratis, siempre',
  features: [
    'Acceso completo al marketplace',
    'Solicitudes ilimitadas',
    'Links y códigos por campaña',
    'Seguimiento de clics, conversiones y comisiones',
    'Perfil público compartible',
  ],
} as const;
