import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { mockApiInterceptor } from '@data/mock/mock-api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(
      routes,
      // Navegar devuelve al principio, salvo al volver atrás: recuperar la
      // posición es lo que se espera al salir de una campaña al marketplace.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions({ skipInitialTransition: true }),
      // Los parámetros de ruta llegan a los componentes como inputs con nombre.
      withComponentInputBinding(),
    ),

    provideHttpClient(withFetch(), withInterceptors([mockApiInterceptor])),

    provideClientHydration(withEventReplay()),
  ],
};
