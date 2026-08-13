import { IsoDate } from './common';
import { CategoryId } from './taxonomy';

export type OrganizationKind =
  'company' | 'brand' | 'agency' | 'independent' | 'studio' | 'academy' | 'service';

export const ORGANIZATION_KIND_LABELS: Record<OrganizationKind, string> = {
  company: 'Empresa',
  brand: 'Marca',
  agency: 'Agencia',
  independent: 'Profesional independiente',
  studio: 'Estudio',
  academy: 'Academia',
  service: 'Servicio especializado',
};

/** Señales de confianza. RELAY no tiene reseñas: la confianza es operativa. */
export type TrustSignal = 'verified' | 'on-time-payment' | 'fast-response';

export const TRUST_SIGNAL_LABELS: Record<TrustSignal, string> = {
  verified: 'Organización verificada',
  'on-time-payment': 'Pago puntual',
  'fast-response': 'Respuesta rápida',
};

export type OrganizationPlan = 'starter' | 'growth' | 'scale';

export const PLAN_LABELS: Record<OrganizationPlan, string> = {
  starter: 'Starter',
  growth: 'Growth',
  scale: 'Scale',
};

export type TeamRole = 'owner' | 'member';

export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly role: TeamRole;
  readonly status: 'active' | 'invited';
  readonly joinedAt: IsoDate;
}

/** Métricas operativas públicas: lo que un afiliado necesita para decidir. */
export interface OrganizationMetrics {
  readonly activeAffiliates: number;
  readonly averageReviewDays: number;
  readonly approvalRate: number;
  readonly completedCampaigns: number;
}

export interface Organization {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly initials: string;
  readonly kind: OrganizationKind;
  readonly categoryId: CategoryId;
  readonly tagline: string;
  readonly description: string;
  readonly location: string;
  readonly country: string;
  readonly website: string;
  readonly plan: OrganizationPlan;

  readonly trustSignals: readonly TrustSignal[];
  readonly metrics: OrganizationMetrics;
  readonly team: readonly TeamMember[];

  readonly createdAt: IsoDate;
}
