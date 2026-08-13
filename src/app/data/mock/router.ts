import { HttpErrorResponse } from '@angular/common/http';

export interface MockRequest {
  readonly method: string;
  readonly path: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: URLSearchParams;
  readonly body: unknown;
}

export type MockHandler = (request: MockRequest) => unknown;

export interface MockRoute {
  readonly method: string;
  /** Patrón con segmentos `:param`, por ejemplo `/api/campaigns/:slug`. */
  readonly pattern: string;
  readonly handle: MockHandler;
}

/** Error con código HTTP, para que los manejadores respondan 404 o 409. */
export class MockApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFound(entity: string): never {
  throw new MockApiError(404, `${entity} no encontrado`);
}

export function conflict(message: string): never {
  throw new MockApiError(409, message);
}

/**
 * Resuelve una ruta contra la tabla de endpoints simulados.
 *
 * El emparejamiento es por segmentos y no por expresión regular, para que las
 * rutas se lean igual que se escribirían en un backend real.
 */
export function matchRoute(
  routes: readonly MockRoute[],
  method: string,
  path: string,
): { route: MockRoute; params: Record<string, string> } | null {
  const segments = split(path);

  for (const route of routes) {
    if (route.method !== method) continue;

    const patternSegments = split(route.pattern);
    if (patternSegments.length !== segments.length) continue;

    const params: Record<string, string> = {};
    let matched = true;

    for (let index = 0; index < patternSegments.length; index++) {
      const pattern = patternSegments[index];
      const segment = segments[index];

      if (pattern.startsWith(':')) {
        params[pattern.slice(1)] = decodeURIComponent(segment);
      } else if (pattern !== segment) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return { route, params };
    }
  }

  return null;
}

export function toHttpError(error: unknown, url: string): HttpErrorResponse {
  const status = error instanceof MockApiError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Error inesperado';

  return new HttpErrorResponse({
    url,
    status,
    statusText: message,
    error: { message },
  });
}

function split(path: string): string[] {
  return path.split('/').filter(Boolean);
}
