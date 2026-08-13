import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { delay, Observable, of, throwError } from 'rxjs';

import { DemoStore } from '../store/demo-store';
import { accountRoutes } from './handlers/account.handler';
import { applicationRoutes } from './handlers/applications.handler';
import { catalogRoutes } from './handlers/catalog.handler';
import { trackingRoutes } from './handlers/tracking.handler';
import { matchRoute, MockRoute, toHttpError } from './router';

/**
 * Latencia simulada.
 *
 * Sin ella la interfaz nunca mostraría un skeleton y los estados de carga
 * quedarían sin probar. En el servidor es cero: el prerender no debe esperar.
 */
const LATENCY_MS = 180;

/**
 * Transporte REST simulado.
 *
 * Intercepta las peticiones a `/api/**` y las resuelve contra el estado local
 * de la demo, sin llegar nunca a la red. Los componentes usan `HttpClient`
 * contra rutas REST normales, así que sustituir esta capa por un backend real
 * consiste en no registrar el interceptor.
 */
export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) {
    return next(request);
  }

  const store = inject(DemoStore);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const routes = buildRoutes(store);

  const url = new URL(request.url, 'http://relay.local');
  const matched = matchRoute(routes, request.method, url.pathname);

  if (!matched) {
    return throwError(
      () =>
        new HttpErrorResponse({
          url: request.url,
          status: 404,
          statusText: `Endpoint no implementado: ${request.method} ${url.pathname}`,
        }),
    );
  }

  let response: Observable<HttpEvent<unknown>>;

  try {
    const body = matched.route.handle({
      method: request.method,
      path: url.pathname,
      params: matched.params,
      query: url.searchParams,
      body: request.body,
    });

    response = of(new HttpResponse({ status: 200, body, url: request.url }));
  } catch (error) {
    response = throwError(() => toHttpError(error, request.url));
  }

  return isBrowser ? response.pipe(delay(LATENCY_MS)) : response;
};

let cachedRoutes: { store: DemoStore; routes: MockRoute[] } | null = null;

/** La tabla se construye una vez por store: es constante durante la sesión. */
function buildRoutes(store: DemoStore): MockRoute[] {
  if (cachedRoutes?.store === store) {
    return cachedRoutes.routes;
  }

  const routes = [
    ...catalogRoutes(store),
    ...applicationRoutes(store),
    ...trackingRoutes(store),
    ...accountRoutes(store),
  ];

  cachedRoutes = { store, routes };
  return routes;
}
