import { describe, expect, it } from 'vitest';

import {
  activeFilterCount,
  EMPTY_FILTERS,
  hasAnyFilter,
  parseFilters,
  toggle,
  toQueryParams,
  toRequestParams,
} from './marketplace-filters';

/**
 * Los filtros del marketplace viven en la URL, así que la traducción entre
 * ambos formatos es la pieza que decide si una búsqueda se puede compartir y
 * si el botón «atrás» del navegador se comporta.
 */
describe('parseFilters', () => {
  it('devuelve el estado vacío cuando no hay parámetros', () => {
    expect(parseFilters({})).toEqual(EMPTY_FILTERS);
  });

  it('lee listas separadas por comas', () => {
    const filters = parseFilters({ categoria: 'servicios,educacion', canal: 'instagram' });

    expect(filters.categories).toEqual(['servicios', 'educacion']);
    expect(filters.channels).toEqual(['instagram']);
  });

  it('lee banderas y números', () => {
    const filters = parseFilters({ elegibles: 'true', match: '80', pagina: '3' });

    expect(filters.eligible).toBe(true);
    expect(filters.minMatch).toBe(80);
    expect(filters.page).toBe(3);
  });

  it('nunca devuelve una página menor que 1', () => {
    expect(parseFilters({ pagina: '0' }).page).toBe(1);
    expect(parseFilters({ pagina: 'abc' }).page).toBe(1);
  });
});

describe('toQueryParams', () => {
  it('omite todo lo que coincide con el estado vacío', () => {
    const params = toQueryParams(EMPTY_FILTERS);

    expect(Object.values(params).every((value) => value === null)).toBe(true);
  });

  it('serializa listas y conserva solo lo activo', () => {
    const params = toQueryParams({
      ...EMPTY_FILTERS,
      q: 'landing',
      categories: ['servicios'],
      access: ['selective', 'premium'],
      saved: true,
      sort: 'match',
      page: 2,
    });

    expect(params['q']).toBe('landing');
    expect(params['categoria']).toBe('servicios');
    expect(params['acceso']).toBe('selective,premium');
    expect(params['guardadas']).toBe(true);
    expect(params['orden']).toBe('match');
    expect(params['pagina']).toBe(2);
    expect(params['canal']).toBeNull();
  });

  it('es reversible: parsear lo serializado devuelve los mismos filtros', () => {
    const filters = {
      ...EMPTY_FILTERS,
      q: 'norte',
      categories: ['servicios' as const],
      commissionModels: ['recurring' as const],
      minMatch: 80,
      newThisWeek: true,
      sort: 'commission' as const,
      page: 4,
    };

    const serialized = toQueryParams(filters);
    const params = Object.fromEntries(
      Object.entries(serialized)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => [key, String(value)]),
    );

    expect(parseFilters(params)).toEqual(filters);
  });
});

describe('toRequestParams', () => {
  it('traduce a los nombres que espera la capa REST', () => {
    const params = toRequestParams(
      { ...EMPTY_FILTERS, categories: ['educacion'], eligible: true },
      'lucia-vega',
      12,
    );

    expect(params['category']).toEqual(['educacion']);
    expect(params['eligible']).toBe(true);
    expect(params['affiliateId']).toBe('lucia-vega');
    expect(params['pageSize']).toBe(12);
  });

  it('envía null cuando no hay umbral de compatibilidad', () => {
    expect(toRequestParams(EMPTY_FILTERS, null, 12)['minMatch']).toBeNull();
  });
});

describe('activeFilterCount', () => {
  it('no cuenta la búsqueda ni el orden', () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, q: 'landing', sort: 'match' })).toBe(0);
  });

  it('suma cada valor seleccionado y cada bandera', () => {
    const count = activeFilterCount({
      ...EMPTY_FILTERS,
      categories: ['servicios', 'educacion'],
      saved: true,
      minMatch: 80,
    });

    expect(count).toBe(4);
  });

  it('la búsqueda sí cuenta como filtro activo para el resto de la vista', () => {
    expect(hasAnyFilter({ ...EMPTY_FILTERS, q: 'landing' })).toBe(true);
    expect(hasAnyFilter(EMPTY_FILTERS)).toBe(false);
  });
});

describe('toggle', () => {
  it('añade y quita manteniendo el resto', () => {
    expect(toggle(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
  });
});
