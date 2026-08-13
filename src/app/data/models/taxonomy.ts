import { IconName } from '@ds/icon/icon-registry.generated';

/**
 * Vocabularios controlados del marketplace.
 *
 * Las categorías, los canales y los niveles no son datos editables: son parte
 * del producto. Viven aquí y no en el seed para que los filtros, el wizard y
 * el matching compartan exactamente el mismo conjunto de valores.
 */

export type CategoryId =
  | 'tecnologia'
  | 'educacion'
  | 'marketing'
  | 'servicios'
  | 'productividad'
  | 'finanzas'
  | 'salud'
  | 'membresias';

export interface Subcategory {
  readonly id: string;
  readonly label: string;
}

export interface Category {
  readonly id: CategoryId;
  readonly label: string;
  readonly icon: IconName;
  readonly subcategories: readonly Subcategory[];
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'tecnologia',
    label: 'Tecnología y SaaS',
    icon: 'layers',
    subcategories: [
      { id: 'saas', label: 'Software como servicio' },
      { id: 'herramientas', label: 'Herramientas digitales' },
      { id: 'infraestructura', label: 'Infraestructura' },
    ],
  },
  {
    id: 'educacion',
    label: 'Educación',
    icon: 'book-open',
    subcategories: [
      { id: 'cursos', label: 'Cursos y bootcamps' },
      { id: 'certificaciones', label: 'Certificaciones' },
      { id: 'mentoria', label: 'Mentoría' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing y diseño',
    icon: 'campaigns',
    subcategories: [
      { id: 'branding', label: 'Branding' },
      { id: 'publicidad', label: 'Publicidad' },
      { id: 'contenido', label: 'Contenido' },
    ],
  },
  {
    id: 'servicios',
    label: 'Servicios profesionales',
    icon: 'organization',
    subcategories: [
      { id: 'desarrollo-web', label: 'Desarrollo web' },
      { id: 'consultoria', label: 'Consultoría' },
      { id: 'legal', label: 'Legal y contable' },
    ],
  },
  {
    id: 'productividad',
    label: 'Productividad',
    icon: 'target',
    subcategories: [
      { id: 'gestion', label: 'Gestión de trabajo' },
      { id: 'automatizacion', label: 'Automatización' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas y seguros',
    icon: 'commissions',
    subcategories: [
      { id: 'inversion', label: 'Inversión' },
      { id: 'seguros', label: 'Seguros' },
    ],
  },
  {
    id: 'salud',
    label: 'Salud y bienestar',
    icon: 'activity',
    subcategories: [
      { id: 'nutricion', label: 'Nutrición' },
      { id: 'entrenamiento', label: 'Entrenamiento' },
    ],
  },
  {
    id: 'membresias',
    label: 'Suscripciones y membresías',
    icon: 'star',
    subcategories: [
      { id: 'comunidad', label: 'Comunidades' },
      { id: 'contenido-premium', label: 'Contenido premium' },
    ],
  },
];

export type TagId =
  | 'alta-comision'
  | 'recurrente'
  | 'aceptacion-inmediata'
  | 'peru'
  | 'nuevo'
  | 'trending'
  | 'top-performing'
  | 'selectiva'
  | 'premium';

export const TAG_LABELS: Record<TagId, string> = {
  'alta-comision': 'Alta comisión',
  recurrente: 'Recurrente',
  'aceptacion-inmediata': 'Aceptación inmediata',
  peru: 'Perú',
  nuevo: 'Nuevo',
  trending: 'Trending',
  'top-performing': 'Top performing',
  selectiva: 'Selectiva',
  premium: 'Premium',
};

/**
 * Canales de difusión.
 *
 * El icono es genérico a propósito: RELAY no reproduce marcas ajenas, y el
 * nombre del canal siempre acompaña al icono.
 */
export type ChannelId =
  'instagram' | 'youtube' | 'tiktok' | 'newsletter' | 'linkedin' | 'blog' | 'podcast' | 'comunidad';

export interface Channel {
  readonly id: ChannelId;
  readonly label: string;
  readonly icon: IconName;
}

export const CHANNELS: readonly Channel[] = [
  { id: 'instagram', label: 'Instagram', icon: 'channel-social' },
  { id: 'youtube', label: 'YouTube', icon: 'channel-video' },
  { id: 'tiktok', label: 'TikTok', icon: 'channel-short-video' },
  { id: 'newsletter', label: 'Newsletter', icon: 'channel-newsletter' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'channel-web' },
  { id: 'blog', label: 'Blog', icon: 'channel-blog' },
  { id: 'podcast', label: 'Podcast', icon: 'channel-podcast' },
  { id: 'comunidad', label: 'Comunidad', icon: 'channel-community' },
];

export type NicheId =
  | 'marketing'
  | 'diseno'
  | 'negocios'
  | 'productividad'
  | 'herramientas'
  | 'educacion'
  | 'finanzas'
  | 'tecnologia'
  | 'bienestar';

export const NICHE_LABELS: Record<NicheId, string> = {
  marketing: 'Marketing',
  diseno: 'Diseño',
  negocios: 'Negocios',
  productividad: 'Productividad',
  herramientas: 'Herramientas digitales',
  educacion: 'Educación',
  finanzas: 'Finanzas',
  tecnologia: 'Tecnología',
  bienestar: 'Bienestar',
};

export type AffiliateType = 'creator' | 'community' | 'professional' | 'publisher' | 'marketer';

export const AFFILIATE_TYPE_LABELS: Record<AffiliateType, string> = {
  creator: 'Creador de contenido',
  community: 'Comunidad',
  professional: 'Profesional',
  publisher: 'Medio o publisher',
  marketer: 'Afiliado especializado',
};

export type AffiliateLevel = 'starter' | 'rising' | 'pro' | 'elite';

export const AFFILIATE_LEVELS: readonly AffiliateLevel[] = ['starter', 'rising', 'pro', 'elite'];

export const AFFILIATE_LEVEL_LABELS: Record<AffiliateLevel, string> = {
  starter: 'Starter',
  rising: 'Rising',
  pro: 'Pro',
  elite: 'Elite',
};

/** Orden de los niveles, para comparar requisitos mínimos. */
export function levelRank(level: AffiliateLevel): number {
  return AFFILIATE_LEVELS.indexOf(level);
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

export function subcategoryLabel(categoryId: CategoryId, subcategoryId: string): string {
  return (
    CATEGORIES.find((category) => category.id === categoryId)?.subcategories.find(
      (subcategory) => subcategory.id === subcategoryId,
    )?.label ?? subcategoryId
  );
}

export function channelLabel(id: ChannelId): string {
  return CHANNELS.find((channel) => channel.id === id)?.label ?? id;
}

export function channelIcon(id: ChannelId): IconName {
  return CHANNELS.find((channel) => channel.id === id)?.icon ?? 'channel-web';
}
