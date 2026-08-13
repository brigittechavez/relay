import { IsoDate, Money } from './common';
import { CategoryId, ChannelId, NicheId, TagId, AffiliateLevel } from './taxonomy';

/** Modalidad de acceso. Determina el flujo de solicitud, no la comisión. */
export type CampaignAccess = 'open' | 'selective' | 'premium';

export type CampaignStatus =
  'draft' | 'pending-review' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';

export type CommissionModel = 'percentage' | 'fixed' | 'recurring' | 'per-lead' | 'tiered';

/** Evento que genera comisión. Lo define la campaña. */
export type ConversionEvent =
  'sale' | 'subscription' | 'lead' | 'booking' | 'enrollment' | 'contract';

export type AttributionWindow = 'session' | '24h' | '7d' | '15d' | '30d' | '60d';

export type PriceUnit = 'one-time' | 'month' | 'year';

export interface CommissionTerms {
  readonly model: CommissionModel;
  /** Porcentaje sobre el valor de la conversión (modelos `percentage`/`recurring`). */
  readonly percentage?: number;
  /** Importe fijo por conversión (modelos `fixed`/`per-lead`). */
  readonly amount?: Money;
  /** Meses que se paga una comisión recurrente. */
  readonly recurringMonths?: number;
  /** Bono al alcanzar un número de conversiones aprobadas. */
  readonly bonus?: { readonly threshold: number; readonly amount: Money };
  readonly conversionEvent: ConversionEvent;
  readonly attributionWindow: AttributionWindow;
}

export type RequirementKind =
  'level' | 'score' | 'profile' | 'niche' | 'channel' | 'country' | 'experience';

/**
 * Requisito de acceso.
 *
 * `mandatory: false` marca los recomendados: no bloquean la solicitud pero
 * pesan en la decisión de la organización y se muestran como pendientes.
 */
export interface CampaignRequirement {
  readonly id: string;
  readonly kind: RequirementKind;
  readonly label: string;
  readonly mandatory: boolean;
  /** Umbral asociado al requisito (nivel mínimo, score mínimo, % de perfil). */
  readonly level?: AffiliateLevel;
  readonly score?: number;
  readonly profileCompleteness?: number;
  readonly niches?: readonly NicheId[];
  readonly channels?: readonly ChannelId[];
  readonly countries?: readonly string[];
  readonly categories?: readonly CategoryId[];
}

export type ResourceKind = 'image' | 'copy' | 'guide' | 'link';

export interface CampaignResource {
  readonly id: string;
  readonly kind: ResourceKind;
  readonly title: string;
  readonly description: string;
  /** Texto listo para copiar (recursos de tipo `copy`). */
  readonly body?: string;
  /** Formato de los assets descargables simulados. */
  readonly format?: string;
}

/**
 * Imagen de campaña.
 *
 * `src` apunta a un archivo servido desde `public/`. El alt es obligatorio:
 * describe lo que se ve, no repite el nombre de la campaña.
 */
export interface CampaignImage {
  readonly src: string;
  /** Descripción de lo que muestra la imagen, no el nombre de la campaña. */
  readonly alt: string;
}

export interface CampaignDuration {
  readonly type: 'evergreen' | 'scheduled';
  readonly startsAt?: IsoDate;
  readonly endsAt?: IsoDate;
}

/** Meta principal de la campaña. Una sola: RELAY no gamifica. */
export interface CampaignGoal {
  readonly label: string;
  readonly target: number;
  readonly unit: 'conversions' | 'clicks' | 'commission';
}

export interface CampaignMetrics {
  readonly activeAffiliates: number;
  readonly conversionRate: number;
  readonly conversions: number;
  readonly clicks: number;
}

export interface Campaign {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly organizationId: string;

  readonly categoryId: CategoryId;
  readonly subcategoryId: string;
  readonly tags: readonly TagId[];

  /** Frase de una línea usada en tarjetas y resultados de búsqueda. */
  readonly summary: string;
  readonly description: string;
  readonly offer: string;
  readonly price: Money;
  readonly priceUnit: PriceUnit;

  readonly commission: CommissionTerms;
  readonly access: CampaignAccess;
  readonly status: CampaignStatus;
  readonly duration: CampaignDuration;

  readonly requirements: readonly CampaignRequirement[];
  /** Canales en los que se permite promocionar. */
  readonly channels: readonly ChannelId[];
  readonly niches: readonly NicheId[];
  readonly countries: readonly string[];
  readonly audience: string;
  /** Audiencia de referencia para el match. No es un requisito de acceso. */
  readonly audienceTarget: number;
  readonly restrictions: readonly string[];
  readonly benefits: readonly string[];

  readonly landingUrl: string;
  readonly resources: readonly CampaignResource[];
  readonly promoCodeEnabled: boolean;
  /** Pregunta de estrategia en campañas selectivas y premium. */
  readonly strategyQuestion?: string;

  readonly goal: CampaignGoal;
  readonly metrics: CampaignMetrics;

  /** Identificador del placeholder visual, usado mientras no haya imagen. */
  readonly cover: string;

  /**
   * Imagen definitiva de la campaña.
   *
   * Mientras no exista, la portada se dibuja con el placeholder geométrico, que
   * ocupa exactamente la misma proporción: añadir la imagen no mueve nada.
   */
  readonly image?: CampaignImage;

  readonly createdAt: IsoDate;
  readonly publishedAt?: IsoDate;
}

export const ACCESS_LABELS: Record<CampaignAccess, string> = {
  open: 'Abierta',
  selective: 'Selectiva',
  premium: 'Premium',
};

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  'pending-review': 'En revisión',
  scheduled: 'Programada',
  active: 'Activa',
  paused: 'Pausada',
  ended: 'Finalizada',
  archived: 'Archivada',
};

export const CONVERSION_EVENT_LABELS: Record<ConversionEvent, string> = {
  sale: 'Venta cerrada',
  subscription: 'Suscripción activa',
  lead: 'Lead cualificado',
  booking: 'Reserva confirmada',
  enrollment: 'Inscripción pagada',
  contract: 'Cliente cerrado',
};

export const ATTRIBUTION_LABELS: Record<AttributionWindow, string> = {
  session: 'Sesión',
  '24h': '24 horas',
  '7d': '7 días',
  '15d': '15 días',
  '30d': '30 días',
  '60d': '60 días',
};

export const PRICE_UNIT_SUFFIX: Record<PriceUnit, string> = {
  'one-time': '',
  month: '/mes',
  year: '/año',
};
