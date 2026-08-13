import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from './session.store';
import { SavedStore } from './saved.store';

/**
 * Acceso a las áreas autenticadas.
 *
 * No protege nada: no hay datos privados ni servidor. Lo que hace es garantizar
 * que exista un contexto de demo antes de entrar en `/app/**`, porque sin
 * perfil activo esas vistas no tendrían de dónde sacar el estado.
 *
 * Cuando no lo hay, lleva al acceso conservando el destino previsto para poder
 * retomarlo después.
 */
export const requireDemoSession: CanActivateFn = async (_route, state) => {
  const session = inject(SessionStore);
  const saved = inject(SavedStore);
  const router = inject(Router);

  await session.restore();

  if (!session.isActive()) {
    return router.createUrlTree(['/login'], { queryParams: { destino: state.url } });
  }

  // Un registro nuevo entra sin perfil: el onboarding es parte del alta.
  if (session.needsOnboarding()) {
    return router.createUrlTree(['/onboarding']);
  }

  await saved.load();
  return true;
};

/** El onboarding solo tiene sentido con una sesión recién creada. */
export const requirePendingOnboarding: CanActivateFn = async () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  await session.restore();

  if (!session.isActive()) {
    return router.createUrlTree(['/registro']);
  }

  if (!session.needsOnboarding()) {
    return router.createUrlTree(['/app/affiliate/inicio']);
  }

  return true;
};

/**
 * Acceso a una organización concreta.
 *
 * Impide entrar al espacio de una organización que no está en la cuenta y, de
 * paso, mantiene sincronizado el workspace activo con la URL: abrir un enlace
 * directo cambia el contexto, que es lo que se espera.
 */
export const requireOrganization: CanActivateFn = async (route) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  const organizationId = route.paramMap.get('organizationId');
  const current = session.session();

  if (!organizationId || !current?.organizationIds.includes(organizationId)) {
    return router.createUrlTree(['/app/affiliate/inicio']);
  }

  if (current.activeWorkspaceId !== organizationId) {
    await session.setActiveWorkspace(organizationId);
  }

  return true;
};

/** Mantiene el workspace activo en el perfil de afiliado. */
export const activateAffiliateWorkspace: CanActivateFn = async () => {
  const session = inject(SessionStore);
  const current = session.session();

  if (current && current.activeWorkspaceId !== current.affiliateId) {
    await session.setActiveWorkspace(current.affiliateId);
  }

  return true;
};
