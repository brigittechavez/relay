import { Routes } from '@angular/router';

import { PublicShell } from '@core/layout/public-shell';

/**
 * Rutas de RELAY.
 *
 * Tres áreas sobre una sola aplicación: pública, afiliado y organización. Todo
 * se carga de forma diferida salvo el shell público, que es lo que necesita la
 * primera pantalla.
 *
 * `data.overHero` indica al shell que la página abre con un bloque Ink a
 * sangre, de modo que la cabecera arranque transparente. `data.title` alimenta
 * los metadatos en la fase de SEO.
 */
export const routes: Routes = [
  {
    path: '',
    component: PublicShell,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@features/public/landing/landing-page').then((m) => m.LandingPage),
        data: {
          overHero: true,
          title: 'RELAY · Marketplace de marketing de afiliados',
          description:
            'Conecta empresas y profesionales con afiliados que ya tienen la audiencia adecuada. ' +
            'Comisiones explícitas, requisitos claros y resultados medibles.',
        },
      },
      {
        path: 'marketplace',
        loadComponent: () =>
          import('@features/public/marketplace/marketplace-page').then((m) => m.MarketplacePage),
        data: {
          title: 'Marketplace de campañas · RELAY',
          description:
            'Explora campañas de afiliación por categoría, comisión, canal y modalidad de acceso.',
        },
      },
      {
        path: 'campanas/:slug',
        loadComponent: () =>
          import('@features/public/campaign/campaign-detail-page').then(
            (m) => m.CampaignDetailPage,
          ),
      },
      {
        path: 'afiliados/:slug',
        loadComponent: () =>
          import('@features/public/profiles/affiliate-profile-page').then(
            (m) => m.AffiliateProfilePage,
          ),
      },
      {
        path: 'organizaciones/:slug',
        loadComponent: () =>
          import('@features/public/profiles/organization-profile-page').then(
            (m) => m.OrganizationProfilePage,
          ),
      },
      {
        path: 'como-funciona',
        loadComponent: () =>
          import('@features/public/marketing/how-it-works-page').then((m) => m.HowItWorksPage),
        data: {
          title: 'Cómo funciona RELAY',
          description:
            'Los dos recorridos del marketplace: descubrir y promocionar campañas, o publicar un ' +
            'programa de afiliación y medirlo.',
        },
      },
      {
        path: 'para-empresas',
        loadComponent: () =>
          import('@features/public/marketing/for-business-page').then((m) => m.ForBusinessPage),
        data: {
          overHero: true,
          title: 'RELAY para empresas y profesionales',
          description:
            'Publica tu programa de afiliación, elige con quién trabajas y paga solo por la ' +
            'conversión que tú defines.',
        },
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('@features/public/pricing/pricing-page').then((m) => m.PricingPage),
        data: {
          title: 'Planes de RELAY',
          description: 'Gratis para afiliados. Starter, Growth y Scale para organizaciones.',
        },
      },
      {
        path: 'login',
        loadComponent: () => import('@features/public/auth/login-page').then((m) => m.LoginPage),
        data: { title: 'Entrar en la demo · RELAY' },
      },
      {
        path: 'registro',
        loadComponent: () => import('@features/public/auth/signup-page').then((m) => m.SignupPage),
        data: { title: 'Crear cuenta demo · RELAY' },
      },
      {
        path: '404',
        loadComponent: () =>
          import('@features/public/errors/not-found-page').then((m) => m.NotFoundPage),
        data: { title: 'Página no encontrada · RELAY' },
      },
      {
        path: '**',
        loadComponent: () =>
          import('@features/public/errors/not-found-page').then((m) => m.NotFoundPage),
        data: { title: 'Página no encontrada · RELAY' },
      },
    ],
  },
];
