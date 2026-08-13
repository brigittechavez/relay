import { IsoDate } from './common';
import { AffiliateLevel, AffiliateType, CategoryId, ChannelId, NicheId } from './taxonomy';

export interface AffiliateChannel {
  readonly id: ChannelId;
  readonly handle: string;
  readonly audience: number;
}

/**
 * Desglose del Relay Score.
 *
 * Los cuatro componentes suman 100. Es una puntuación simulada: no existe un
 * motor que la recalcule, pero el desglose permite explicar de dónde sale.
 */
export interface RelayScoreBreakdown {
  readonly performance: number;
  readonly experience: number;
  readonly profile: number;
  readonly consistency: number;
}

export const SCORE_MAX: RelayScoreBreakdown = {
  performance: 40,
  experience: 25,
  profile: 20,
  consistency: 15,
};

export const SCORE_LABELS: Record<keyof RelayScoreBreakdown, string> = {
  performance: 'Rendimiento',
  experience: 'Experiencia',
  profile: 'Perfil',
  consistency: 'Consistencia',
};

export type AffiliateBadge =
  'verified' | 'complete-profile' | 'top-performer' | 'fast-response' | 'recurring';

export const BADGE_LABELS: Record<AffiliateBadge, string> = {
  verified: 'Perfil verificado',
  'complete-profile': 'Perfil completo',
  'top-performer': 'Top performer',
  'fast-response': 'Respuesta rápida',
  recurring: 'Colaboración recurrente',
};

/** Resultado destacado que el afiliado elige mostrar en su perfil público. */
export interface PortfolioResult {
  readonly campaignName: string;
  readonly organizationName: string;
  readonly conversions: number;
  readonly conversionRate: number;
}

/** Experiencia acumulada por categoría, usada en el matching contextual. */
export interface CategoryExperience {
  readonly categoryId: CategoryId;
  readonly campaigns: number;
  readonly conversions: number;
}

/** Qué partes del perfil son visibles públicamente. */
export interface ProfileVisibility {
  readonly audience: boolean;
  readonly results: boolean;
  readonly availability: boolean;
  readonly channels: boolean;
  readonly relayScore: boolean;
}

export interface Affiliate {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly headline: string;
  readonly bio: string;
  readonly initials: string;
  readonly type: AffiliateType;
  readonly location: string;
  readonly country: string;

  readonly level: AffiliateLevel;
  readonly relayScore: number;
  readonly scoreBreakdown: RelayScoreBreakdown;
  /** Porcentaje de avance hacia el siguiente nivel. */
  readonly levelProgress: number;
  readonly profileCompleteness: number;

  readonly niches: readonly NicheId[];
  readonly channels: readonly AffiliateChannel[];
  readonly badges: readonly AffiliateBadge[];
  readonly available: boolean;

  readonly portfolio: readonly PortfolioResult[];
  readonly experience: readonly CategoryExperience[];
  readonly averageConversionRate: number;

  readonly visibility: ProfileVisibility;
  readonly joinedAt: IsoDate;
}

/** Audiencia total sumando todos los canales declarados. */
export function totalAudience(affiliate: Affiliate): number {
  return affiliate.channels.reduce((total, channel) => total + channel.audience, 0);
}

/** Acciones sugeridas para completar el perfil, en orden de impacto. */
export interface ProfileSuggestion {
  readonly id: string;
  readonly label: string;
  readonly points: number;
}
