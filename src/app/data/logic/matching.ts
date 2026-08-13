import { Affiliate, totalAudience } from '../models/affiliate';
import { Campaign, CampaignRequirement } from '../models/campaign';
import { levelRank } from '../models/taxonomy';

/**
 * Compatibilidad entre un afiliado y una campaña.
 *
 * Es una señal **simulada**: no hay motor de recomendación detrás. Es una suma
 * ponderada de datos que ya están en el perfil, elegida para que el número sea
 * explicable —cada punto se puede rastrear hasta un campo concreto— en lugar
 * de para parecer sofisticada.
 *
 * Los pesos suman 100.
 */
export const MATCH_WEIGHTS = {
  /** Solapamiento entre los nichos del afiliado y los de la campaña. */
  niches: 32,
  /** Canales del afiliado entre los que la campaña permite. */
  channels: 22,
  /** El país del afiliado está entre los admitidos. */
  country: 14,
  /** Tamaño de audiencia frente al que la campaña considera relevante. */
  audience: 14,
  /** Completitud del perfil. */
  profile: 12,
  /** Conversiones previas en la categoría de la campaña. */
  experience: 6,
} as const;

export interface MatchComponent {
  readonly id: keyof typeof MATCH_WEIGHTS;
  readonly label: string;
  readonly points: number;
  readonly max: number;
}

export interface MatchResult {
  readonly score: number;
  readonly components: readonly MatchComponent[];
}

const LABELS: Record<keyof typeof MATCH_WEIGHTS, string> = {
  niches: 'Nicho',
  channels: 'Canales',
  country: 'Ubicación',
  audience: 'Audiencia',
  profile: 'Perfil',
  experience: 'Experiencia',
};

function overlapRatio(
  affiliateValues: readonly string[],
  campaignValues: readonly string[],
): number {
  if (!campaignValues.length) return 1;

  const owned = new Set(affiliateValues);
  const matched = campaignValues.filter((value) => owned.has(value)).length;

  return matched / campaignValues.length;
}

/** Desglose completo, usado por el componente que explica el match. */
export function computeMatch(affiliate: Affiliate, campaign: Campaign): MatchResult {
  const experience = affiliate.experience.find((entry) => entry.categoryId === campaign.categoryId);

  const ratios: Record<keyof typeof MATCH_WEIGHTS, number> = {
    niches: overlapRatio(affiliate.niches, campaign.niches),
    channels: overlapRatio(
      affiliate.channels.map((channel) => channel.id),
      campaign.channels,
    ),
    country: campaign.countries.includes(affiliate.country) ? 1 : 0,
    audience: campaign.audienceTarget
      ? Math.min(1, totalAudience(affiliate) / campaign.audienceTarget)
      : 1,
    profile: affiliate.profileCompleteness / 100,
    experience: experience ? Math.min(1, experience.conversions / 10) : 0,
  };

  const components = (Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[]).map((id) => ({
    id,
    label: LABELS[id],
    points: ratios[id] * MATCH_WEIGHTS[id],
    max: MATCH_WEIGHTS[id],
  }));

  const score = Math.round(components.reduce((total, component) => total + component.points, 0));

  return { score: Math.min(100, Math.max(0, score)), components };
}

export function computeMatchScore(affiliate: Affiliate, campaign: Campaign): number {
  return computeMatch(affiliate, campaign).score;
}

export interface RequirementCheck {
  readonly requirement: CampaignRequirement;
  readonly met: boolean;
  /** Qué le falta exactamente al afiliado, para poder decírselo. */
  readonly detail: string;
}

export interface Eligibility {
  readonly checks: readonly RequirementCheck[];
  readonly metCount: number;
  readonly total: number;
  /** Ningún requisito obligatorio sin cumplir. */
  readonly eligible: boolean;
  readonly missingMandatory: readonly RequirementCheck[];
  readonly missingRecommended: readonly RequirementCheck[];
}

/**
 * Evalúa la lista de requisitos de una campaña contra un perfil.
 *
 * Los obligatorios bloquean la solicitud; los recomendados no, pero se
 * muestran como pendientes porque pesan en la revisión de la organización.
 */
export function evaluateEligibility(affiliate: Affiliate, campaign: Campaign): Eligibility {
  const checks = campaign.requirements.map((requirement) =>
    evaluateRequirement(affiliate, requirement),
  );

  const missingMandatory = checks.filter((check) => !check.met && check.requirement.mandatory);
  const missingRecommended = checks.filter((check) => !check.met && !check.requirement.mandatory);

  return {
    checks,
    metCount: checks.filter((check) => check.met).length,
    total: checks.length,
    eligible: missingMandatory.length === 0,
    missingMandatory,
    missingRecommended,
  };
}

function evaluateRequirement(
  affiliate: Affiliate,
  requirement: CampaignRequirement,
): RequirementCheck {
  switch (requirement.kind) {
    case 'level': {
      const required = requirement.level ?? 'starter';
      const met = levelRank(affiliate.level) >= levelRank(required);
      return { requirement, met, detail: met ? '' : `Tu nivel actual es ${affiliate.level}` };
    }

    case 'score': {
      const required = requirement.score ?? 0;
      const met = affiliate.relayScore >= required;
      return { requirement, met, detail: met ? '' : `Tu Relay Score es ${affiliate.relayScore}` };
    }

    case 'profile': {
      const required = requirement.profileCompleteness ?? 0;
      const met = affiliate.profileCompleteness >= required;
      return {
        requirement,
        met,
        detail: met ? '' : `Tu perfil está al ${affiliate.profileCompleteness}%`,
      };
    }

    case 'niche': {
      const owned = new Set<string>(affiliate.niches);
      const met = (requirement.niches ?? []).some((niche) => owned.has(niche));
      return { requirement, met, detail: met ? '' : 'Añade este nicho a tu perfil' };
    }

    case 'channel': {
      const owned = new Set<string>(affiliate.channels.map((channel) => channel.id));
      const met = (requirement.channels ?? []).some((channel) => owned.has(channel));
      return { requirement, met, detail: met ? '' : 'Conecta uno de estos canales' };
    }

    case 'country': {
      const met = (requirement.countries ?? []).includes(affiliate.country);
      return { requirement, met, detail: met ? '' : `Tu ubicación es ${affiliate.location}` };
    }

    case 'experience': {
      const categories = requirement.categories ?? [];
      const met = affiliate.experience.some(
        (entry) => categories.includes(entry.categoryId) && entry.conversions > 0,
      );
      return { requirement, met, detail: met ? '' : 'Sin conversiones previas en esta categoría' };
    }
  }
}
