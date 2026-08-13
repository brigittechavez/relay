import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';

import { CAMPAIGNS } from '@data/seed/campaigns.seed';
import { AFFILIATES } from '@data/seed/affiliates.seed';
import { ORGANIZATIONS } from '@data/seed/organizations.seed';

/**
 * Estrategia de renderizado por ruta.
 *
 * - **Prerender** para todo lo público y estable: portada, marketplace,
 *   páginas de marketing y las fichas que ya existen en el catálogo demo. Se
 *   sirven como HTML estático, sin proceso de servidor.
 * - **SSR** para las rutas públicas dinámicas que no estén prerenderizadas —una
 *   campaña creada durante la demo, por ejemplo—, de modo que sigan teniendo
 *   contenido y metadatos en el HTML inicial.
 * - **CSR** para `/app/**`: son vistas privadas que dependen del estado local
 *   del navegador y no aportan nada renderizadas en servidor.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'marketplace', renderMode: RenderMode.Prerender },
  { path: 'como-funciona', renderMode: RenderMode.Prerender },
  { path: 'para-empresas', renderMode: RenderMode.Prerender },
  { path: 'pricing', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'registro', renderMode: RenderMode.Prerender },
  { path: '404', renderMode: RenderMode.Prerender },

  {
    path: 'campanas/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Server,
    getPrerenderParams: async () => CAMPAIGNS.map((campaign) => ({ slug: campaign.slug })),
  },
  {
    path: 'afiliados/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Server,
    getPrerenderParams: async () => AFFILIATES.map((affiliate) => ({ slug: affiliate.slug })),
  },
  {
    path: 'organizaciones/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Server,
    getPrerenderParams: async () =>
      ORGANIZATIONS.map((organization) => ({ slug: organization.slug })),
  },

  { path: '**', renderMode: RenderMode.Server },
];
