import { IconName } from '@ds/icon/icon-registry.generated';

export interface NavItem {
  readonly label: string;
  readonly icon: IconName;
  readonly link: string;
  /** Coincidencia exacta de ruta. Se usa en los índices de cada área. */
  readonly exact?: boolean;
}

export interface PublicNavItem {
  readonly label: string;
  readonly link: string;
}

/** Cabecera pública. Cuatro destinos: sin mega menú ni buscador global. */
export const PUBLIC_NAV: readonly PublicNavItem[] = [
  { label: 'Marketplace', link: '/marketplace' },
  { label: 'Cómo funciona', link: '/como-funciona' },
  { label: 'Para empresas', link: '/para-empresas' },
  { label: 'Precios', link: '/pricing' },
];

/**
 * Barra lateral del afiliado.
 *
 * El orden refleja el recorrido real: se descubre en el marketplace, se
 * gestiona lo activo, y solo al final se consultan resultados y dinero.
 */
export const AFFILIATE_NAV: readonly NavItem[] = [
  { label: 'Inicio', icon: 'home', link: '/app/affiliate/inicio' },
  { label: 'Marketplace', icon: 'marketplace', link: '/app/affiliate/marketplace' },
  { label: 'Campañas', icon: 'campaigns', link: '/app/affiliate/campanas' },
  { label: 'Aplicaciones', icon: 'applications', link: '/app/affiliate/aplicaciones' },
  { label: 'Links', icon: 'link', link: '/app/affiliate/links' },
  { label: 'Ganancias', icon: 'earnings', link: '/app/affiliate/ganancias' },
  { label: 'Guardadas', icon: 'bookmark', link: '/app/affiliate/guardadas' },
];

/** Destinos secundarios del afiliado: viven en «Más», no en la barra. */
export const AFFILIATE_SECONDARY_NAV: readonly NavItem[] = [
  { label: 'Comparar', icon: 'compare', link: '/app/affiliate/comparar' },
  { label: 'Notificaciones', icon: 'bell', link: '/app/affiliate/notificaciones' },
  { label: 'Mi perfil', icon: 'profile', link: '/app/affiliate/perfil' },
  { label: 'Configuración', icon: 'settings', link: '/app/affiliate/configuracion' },
];

/** Bottom navigation en móvil: cuatro destinos frecuentes más «Más». */
export const AFFILIATE_MOBILE_NAV: readonly NavItem[] = [
  { label: 'Inicio', icon: 'home', link: '/app/affiliate/inicio' },
  { label: 'Marketplace', icon: 'marketplace', link: '/app/affiliate/marketplace' },
  { label: 'Campañas', icon: 'campaigns', link: '/app/affiliate/campanas' },
  { label: 'Ganancias', icon: 'earnings', link: '/app/affiliate/ganancias' },
];

/** Barra lateral de organización. `:id` se sustituye por el slug activo. */
export const ORGANIZATION_NAV: readonly NavItem[] = [
  { label: 'Overview', icon: 'overview', link: '/app/organization/:id/overview' },
  { label: 'Campañas', icon: 'campaigns', link: '/app/organization/:id/campanas' },
  { label: 'Aplicaciones', icon: 'applications', link: '/app/organization/:id/aplicaciones' },
  { label: 'Afiliados', icon: 'affiliates', link: '/app/organization/:id/afiliados' },
  { label: 'Conversiones', icon: 'conversions', link: '/app/organization/:id/conversiones' },
  { label: 'Comisiones', icon: 'commissions', link: '/app/organization/:id/comisiones' },
];

export const ORGANIZATION_SECONDARY_NAV: readonly NavItem[] = [
  { label: 'Equipo', icon: 'team', link: '/app/organization/:id/equipo' },
  { label: 'Notificaciones', icon: 'bell', link: '/app/organization/:id/notificaciones' },
  { label: 'Configuración', icon: 'settings', link: '/app/organization/:id/configuracion' },
];

export const ORGANIZATION_MOBILE_NAV: readonly NavItem[] = [
  { label: 'Overview', icon: 'overview', link: '/app/organization/:id/overview' },
  { label: 'Campañas', icon: 'campaigns', link: '/app/organization/:id/campanas' },
  { label: 'Aplicaciones', icon: 'applications', link: '/app/organization/:id/aplicaciones' },
  { label: 'Comisiones', icon: 'commissions', link: '/app/organization/:id/comisiones' },
];

/** Sustituye `:id` por el identificador de la organización activa. */
export function withOrganization(items: readonly NavItem[], organizationId: string): NavItem[] {
  return items.map((item) => ({ ...item, link: item.link.replace(':id', organizationId) }));
}
