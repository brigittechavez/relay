import { Affiliate } from '../models/affiliate';
import { Application } from '../models/application';
import { Campaign } from '../models/campaign';
import { Notification, TimelineEvent } from '../models/notification';
import { Organization } from '../models/organization';
import { Conversion, Partnership, Payout, PromoCode, ReferralLink } from '../models/tracking';
import {
  APPLICATIONS,
  CONVERSIONS,
  NOTIFICATIONS,
  PARTNERSHIPS,
  PAYOUTS,
  PROMO_CODES,
  REFERRAL_LINKS,
  TIMELINE,
} from '../seed/activity.seed';
import { AFFILIATES } from '../seed/affiliates.seed';
import { CAMPAIGNS } from '../seed/campaigns.seed';
import { ORGANIZATIONS } from '../seed/organizations.seed';

/**
 * Versión del esquema persistido.
 *
 * Al cambiar la forma de los datos se incrementa: una demo guardada con un
 * esquema anterior se descarta y se vuelve a sembrar, en lugar de romperse.
 */
export const DEMO_SCHEMA_VERSION = 1;

export interface DemoSession {
  readonly name: string;
  readonly email: string;
  readonly affiliateId: string;
  readonly organizationIds: readonly string[];
  readonly activeWorkspaceId: string;
  /** El onboarding solo se muestra en cuentas creadas desde el registro. */
  readonly onboardingCompleted: boolean;
  readonly startedAt: string;
}

/**
 * Estado completo de la demo.
 *
 * Es lo que se serializa en `localStorage` y lo que sirve la capa mock. Todo
 * lo que el usuario cambia durante la demo vive aquí; nada se guarda fuera.
 */
export interface DemoDatabase {
  version: number;
  affiliates: Affiliate[];
  organizations: Organization[];
  campaigns: Campaign[];
  applications: Application[];
  partnerships: Partnership[];
  links: ReferralLink[];
  promoCodes: PromoCode[];
  conversions: Conversion[];
  payouts: Payout[];
  notifications: Notification[];
  timeline: TimelineEvent[];
  savedCampaigns: string[];
  savedAffiliates: string[];
  comparedCampaigns: string[];
  session: DemoSession | null;
  /** Contadores por prefijo para generar identificadores estables. */
  sequences: Record<string, number>;
}

/** Copia profunda del seed. Cada reinicio parte de datos intactos. */
export function buildSeed(): DemoDatabase {
  return {
    version: DEMO_SCHEMA_VERSION,
    affiliates: clone(AFFILIATES),
    organizations: clone(ORGANIZATIONS),
    campaigns: clone(CAMPAIGNS),
    applications: clone(APPLICATIONS),
    partnerships: clone(PARTNERSHIPS),
    links: clone(REFERRAL_LINKS),
    promoCodes: clone(PROMO_CODES),
    conversions: clone(CONVERSIONS),
    payouts: clone(PAYOUTS),
    notifications: clone(NOTIFICATIONS),
    timeline: clone(TIMELINE),
    savedCampaigns: ['membresia-profesional', 'brand-sprint'],
    savedAffiliates: [],
    comparedCampaigns: [],
    session: null,
    sequences: {},
  };
}

function clone<T>(value: readonly T[]): T[] {
  return value.map((item) => structuredClone(item) as T);
}

/** Identificador incremental y estable dentro de una misma sesión de demo. */
export function nextId(database: DemoDatabase, prefix: string): string {
  const next = (database.sequences[prefix] ?? 0) + 1;
  database.sequences[prefix] = next;
  return `${prefix}-${next}`;
}
