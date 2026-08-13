import { Routes } from '@angular/router';

import { activateAffiliateWorkspace } from '@core/session/demo.guards';
import { AffiliateShell } from './affiliate-shell';

/**
 * Área del afiliado.
 *
 * Todo cuelga del shell y se carga de forma diferida. El guard mantiene el
 * workspace activo en el perfil personal, de modo que abrir un enlace directo
 * a esta área cambie el contexto igual que hacerlo desde el selector.
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
    ],
  },
];
