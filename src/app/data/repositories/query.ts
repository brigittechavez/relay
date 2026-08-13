import { HttpParams } from '@angular/common/http';

export type QueryValue = string | number | boolean | readonly string[] | null | undefined;
export type QueryRecord = Readonly<Record<string, QueryValue>>;

/**
 * Construye los parámetros de una petición descartando lo vacío.
 *
 * Sin esto, cada repositorio acabaría con su propia cadena de condicionales
 * para no enviar `?q=&category=`, que además ensucia la URL y complica leer
 * la pestaña de red.
 */
export function toParams(query: QueryRecord): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '' || value === false) continue;

    if (Array.isArray(value)) {
      if (!value.length) continue;
      params = params.set(key, value.join(','));
      continue;
    }

    params = params.set(key, String(value));
  }

  return params;
}
