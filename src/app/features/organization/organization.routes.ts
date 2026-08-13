import { Routes } from '@angular/router';

import { requireOrganization } from '@core/session/demo.guards';
import { OrganizationShell } from './organization-shell';

/**
 * Área de organización.
 *
 * El identificador viaja en la ruta y llega al shell y a las páginas como
 * input, así que la organización activa es siempre la de la URL.
 *
 * Las secciones internas de una campaña son rutas propias y reutilizan las
 * páginas generales filtrando por `campaignId`: la bandeja de solicitudes de
 * una campaña es la misma bandeja, acotada.
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

      // --- Campañas ---------------------------------------------------------
      {
        path: 'campanas',
        pathMatch: 'full',
        loadComponent: () =>
          import('./campaigns/organization-campaigns-page').then(
            (m) => m.OrganizationCampaignsPage,
          ),
      },
      {
        path: 'campanas/nueva',
        loadComponent: () =>
          import('./campaigns/campaign-wizard-page').then((m) => m.CampaignWizardPage),
      },
      {
        path: 'campanas/:campaignId',
        pathMatch: 'full',
        redirectTo: 'campanas/:campaignId/resumen',
      },
      {
        path: 'campanas/:campaignId/resumen',
        loadComponent: () =>
          import('./campaigns/organization-campaign-page').then((m) => m.OrganizationCampaignPage),
      },
      {
        path: 'campanas/:campaignId/aplicaciones',
        loadComponent: () =>
          import('./applications/organization-applications-page').then(
            (m) => m.OrganizationApplicationsPage,
          ),
      },
      {
        path: 'campanas/:campaignId/afiliados',
        loadComponent: () =>
          import('./affiliates/organization-affiliates-page').then(
            (m) => m.OrganizationAffiliatesPage,
          ),
      },
      {
        path: 'campanas/:campaignId/conversiones',
        loadComponent: () =>
          import('./conversions/organization-conversions-page').then(
            (m) => m.OrganizationConversionsPage,
          ),
      },
      {
        path: 'campanas/:campaignId/configuracion',
        loadComponent: () =>
          import('./campaigns/campaign-settings-page').then((m) => m.CampaignSettingsPage),
      },

      // --- Vistas generales -------------------------------------------------
      {
        path: 'aplicaciones',
        loadComponent: () =>
          import('./applications/organization-applications-page').then(
            (m) => m.OrganizationApplicationsPage,
          ),
      },
      {
        path: 'afiliados',
        loadComponent: () =>
          import('./affiliates/organization-affiliates-page').then(
            (m) => m.OrganizationAffiliatesPage,
          ),
      },
      {
        path: 'conversiones',
        loadComponent: () =>
          import('./conversions/organization-conversions-page').then(
            (m) => m.OrganizationConversionsPage,
          ),
      },
      {
        path: 'comisiones',
        loadComponent: () =>
          import('./commissions/organization-commissions-page').then(
            (m) => m.OrganizationCommissionsPage,
          ),
      },
      {
        path: 'equipo',
        loadComponent: () =>
          import('./team/organization-team-page').then((m) => m.OrganizationTeamPage),
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./notifications/organization-notifications-page').then(
            (m) => m.OrganizationNotificationsPage,
          ),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./settings/organization-settings-page').then((m) => m.OrganizationSettingsPage),
      },

      { path: '**', redirectTo: 'overview' },
    ],
  },
];
