import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { SessionStore } from '@core/session/session.store';
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

    // La sesión demo vive en el navegador. Restaurarla al arrancar hace que las
    // páginas públicas —marketplace, detalle de campaña— muestren también la
    // compatibilidad y el estado de quien ya está dentro de la demo.
    provideAppInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
      return inject(SessionStore).restore();
    }),
  ],
};
