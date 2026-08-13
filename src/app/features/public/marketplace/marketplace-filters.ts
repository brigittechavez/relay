import { Params } from '@angular/router';

import { CampaignAccess, CommissionModel } from '@data/models/campaign';
import { CategoryId, ChannelId, TagId } from '@data/models/taxonomy';

export type CampaignSort = 'relevance' | 'match' | 'commission' | 'recent' | 'conversion-rate';

export interface MarketplaceFilters {
  readonly q: string;
  readonly categories: readonly CategoryId[];
  readonly subcategories: readonly string[];
  readonly access: readonly CampaignAccess[];
  readonly commissionModels: readonly CommissionModel[];
  readonly tags: readonly TagId[];
  readonly channels: readonly ChannelId[];
  /** Solo campañas guardadas. */
  readonly saved: boolean;
  /** Solo campañas para las que el perfil califica. */
  readonly eligible: boolean;
  /** Umbral mínimo de compatibilidad. 0 = sin umbral. */
  readonly minMatch: number;
  readonly newThisWeek: boolean;
  readonly sort: CampaignSort;
  readonly page: number;
}

export const EMPTY_FILTERS: MarketplaceFilters = {
  q: '',
  categories: [],
  subcategories: [],
  access: [],
  commissionModels: [],
  tags: [],
  channels: [],
  saved: false,
  eligible: false,
  minMatch: 0,
  newThisWeek: false,
  sort: 'relevance',
  page: 1,
};

export const SORT_OPTIONS: readonly { readonly id: CampaignSort; readonly label: string }[] = [
  { id: 'relevance', label: 'Relevancia' },
  { id: 'match', label: 'Mayor compatibilidad' },
  { id: 'commission', label: 'Mayor comisión' },
  { id: 'recent', label: 'Más recientes' },
  { id: 'conversion-rate', label: 'Mejor conversión' },
];

/**
 * Los filtros viven en la URL.
 *
 * Es lo que permite compartir una búsqueda, volver atrás sin perderla y
 * prerenderizar el marketplace con un estado conocido. Las funciones de este
 * módulo son la única traducción entre la URL y el estado de la vista.
 */
export function parseFilters(params: Params): MarketplaceFilters {
  return {
    q: str(params['q']),
    categories: list<CategoryId>(params['categoria']),
    subcategories: list<string>(params['subcategoria']),
    access: list<CampaignAccess>(params['acceso']),
    commissionModels: list<CommissionModel>(params['comision']),
    tags: list<TagId>(params['tag']),
    channels: list<ChannelId>(params['canal']),
    saved: bool(params['guardadas']),
    eligible: bool(params['elegibles']),
    minMatch: num(params['match']),
    newThisWeek: bool(params['nuevas']),
    sort: (str(params['orden']) || 'relevance') as CampaignSort,
    page: Math.max(1, num(params['pagina']) || 1),
  };
}

/** Solo se escriben los valores que difieren del estado vacío. */
export function toQueryParams(filters: MarketplaceFilters): Params {
  return {
    q: filters.q || null,
    categoria: join(filters.categories),
    subcategoria: join(filters.subcategories),
    acceso: join(filters.access),
    comision: join(filters.commissionModels),
    tag: join(filters.tags),
    canal: join(filters.channels),
    guardadas: filters.saved || null,
    elegibles: filters.eligible || null,
    match: filters.minMatch || null,
    nuevas: filters.newThisWeek || null,
    orden: filters.sort === 'relevance' ? null : filters.sort,
    pagina: filters.page > 1 ? filters.page : null,
  };
}

/** Parámetros de la petición REST. Los nombres son los del backend simulado. */
export function toRequestParams(
  filters: MarketplaceFilters,
  affiliateId: string | null,
  pageSize: number,
): Record<string, string | number | boolean | readonly string[] | null> {
  return {
    q: filters.q,
    category: filters.categories,
    subcategory: filters.subcategories,
    access: filters.access,
    commissionModel: filters.commissionModels,
    tag: filters.tags,
    channel: filters.channels,
    saved: filters.saved,
    eligible: filters.eligible,
    minMatch: filters.minMatch || null,
    newThisWeek: filters.newThisWeek,
    sort: filters.sort,
    page: filters.page,
    pageSize,
    affiliateId,
  };
}

/** Número de filtros activos, para el contador del botón «Más filtros». */
export function activeFilterCount(filters: MarketplaceFilters): number {
  return (
    filters.categories.length +
    filters.subcategories.length +
    filters.access.length +
    filters.commissionModels.length +
    filters.tags.length +
    filters.channels.length +
    (filters.saved ? 1 : 0) +
    (filters.eligible ? 1 : 0) +
    (filters.minMatch ? 1 : 0) +
    (filters.newThisWeek ? 1 : 0)
  );
}

export function hasAnyFilter(filters: MarketplaceFilters): boolean {
  return activeFilterCount(filters) > 0 || filters.q.length > 0;
}

/** Alterna un valor dentro de una lista de filtro. */
export function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bool(value: unknown): boolean {
  return value === 'true' || value === true;
}

function list<T extends string>(value: unknown): T[] {
  return str(value)
    .split(',')
    .filter(Boolean) as T[];
}

function join(values: readonly string[]): string | null {
  return values.length ? values.join(',') : null;
}
