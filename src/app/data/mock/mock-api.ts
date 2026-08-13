import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject, makeStateKey, PLATFORM_ID, StateKey, TransferState } from '@angular/core';
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
 * Clave de transferencia para una petición.
 *
 * Se incluye el método porque dos verbos sobre la misma ruta no devuelven lo
 * mismo, y la URL con parámetros porque los filtros forman parte de la
 * respuesta.
 */
function stateKeyFor(method: string, url: string): StateKey<unknown> {
  return makeStateKey<unknown>(`rly-api:${method}:${url}`);
}

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
  const transferState = inject(TransferState);
  const routes = buildRoutes(store);

  const stateKey = stateKeyFor(request.method, request.urlWithParams);

  /**
   * Respuesta calculada durante el prerender.
   *
   * Sin esto, al hidratar una página prerenderizada el recurso vuelve a pedir
   * los datos, la plantilla pasa por su estado de carga y el contenido que ya
   * estaba en pantalla se sustituye por un esqueleto más corto: el pie sube y
   * vuelve a bajar. El HTML servido deja de valer para lo único que debería
   * garantizar, que es que no haya salto.
   *
   * Solo se aprovecha la primera vez; a partir de ahí manda el estado local,
   * que es el que cambia cuando alguien usa la demo.
   */
  if (isBrowser && transferState.hasKey(stateKey)) {
    const body = transferState.get(stateKey, null);
    transferState.remove(stateKey);
    return of(new HttpResponse({ status: 200, body, url: request.url }));
  }

  // `urlWithParams` y no `url`: HttpClient guarda los parámetros de consulta
  // aparte y solo los serializa al enviar, de modo que leer `url` dejaría
  // fuera todos los filtros construidos con `HttpParams`.
  const url = new URL(request.urlWithParams, 'http://relay.local');
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

    // Solo las lecturas viajan al cliente: una escritura durante el prerender
    // no existe, y guardarla induciría a repetirla.
    if (!isBrowser && request.method === 'GET') {
      transferState.set(stateKey, body as never);
    }

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
