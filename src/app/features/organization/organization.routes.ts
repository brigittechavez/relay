import { Routes } from '@angular/router';

import { requireOrganization } from '@core/session/demo.guards';
import { OrganizationShell } from './organization-shell';

/**
 * Área de organización.
 *
 * El identificador viaja en la ruta y llega al shell y a las páginas como
 * input, así que la organización activa es siempre la de la URL.
 */
export const organizationRoutes: Routes = [
  {
    path: ':organizationId',
    component: OrganizationShell,
    canActivate: [requireOrganization],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/organization-overview-page').then((m) => m.OrganizationOverviewPage),
      },
    ],
  },
];
