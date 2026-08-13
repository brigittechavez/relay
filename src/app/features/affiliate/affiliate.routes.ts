import { Routes } from '@angular/router';

import { activateAffiliateWorkspace } from '@core/session/demo.guards';
import { AffiliateShell } from './affiliate-shell';

/**
 * Área del afiliado.
 *
 * Todo cuelga del shell y se carga de forma diferida. El guard mantiene el
 * workspace activo en el perfil personal, de modo que abrir un enlace directo
 * a esta área cambie el contexto igual que hacerlo desde el selector.
 *
 * El marketplace autenticado reutiliza el componente público: es la misma
 * vista, y lo único que cambia es que con perfil en contexto puede calcular el
 * match, la elegibilidad y el estado de cada campaña.
 */
export const affiliateRoutes: Routes = [
  {
    path: '',
    component: AffiliateShell,
    canActivate: [activateAffiliateWorkspace],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./home/affiliate-home-page').then((m) => m.AffiliateHomePage),
      },
      {
        path: 'marketplace',
        loadComponent: () =>
          import('@features/public/marketplace/marketplace-page').then((m) => m.MarketplacePage),
      },
      {
        path: 'campanas',
        loadComponent: () =>
          import('./campaigns/affiliate-campaigns-page').then((m) => m.AffiliateCampaignsPage),
      },
      {
        path: 'campanas/:slug/aplicar',
        loadComponent: () => import('./apply/premium-apply-page').then((m) => m.PremiumApplyPage),
      },
      {
        path: 'campanas/:campaignId',
        loadComponent: () =>
          import('./campaigns/campaign-workspace-page').then((m) => m.CampaignWorkspacePage),
      },
      {
        path: 'aplicaciones',
        loadComponent: () =>
          import('./applications/applications-page').then((m) => m.ApplicationsPage),
      },
      {
        path: 'aplicaciones/:applicationId',
        loadComponent: () =>
          import('./applications/application-detail-page').then((m) => m.ApplicationDetailPage),
      },
      {
        path: 'links',
        loadComponent: () => import('./links/links-page').then((m) => m.LinksPage),
      },
      {
        path: 'ganancias',
        loadComponent: () => import('./earnings/earnings-page').then((m) => m.EarningsPage),
      },
      {
        path: 'guardadas',
        loadComponent: () => import('./saved/saved-page').then((m) => m.SavedPage),
      },
      {
        path: 'comparar',
        loadComponent: () => import('./compare/compare-page').then((m) => m.ComparePage),
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./notifications/affiliate-notifications-page').then(
            (m) => m.AffiliateNotificationsPage,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./profile/affiliate-profile-edit-page').then((m) => m.AffiliateProfileEditPage),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./settings/affiliate-settings-page').then((m) => m.AffiliateSettingsPage),
      },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];
