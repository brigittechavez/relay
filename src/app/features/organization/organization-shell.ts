import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { AppShell } from '@core/layout/app-shell';
import {
  ORGANIZATION_MOBILE_NAV,
  ORGANIZATION_NAV,
  ORGANIZATION_SECONDARY_NAV,
  withOrganization,
} from '@core/navigation/navigation';

/**
 * Área de organización.
 *
 * La navegación se reescribe con el identificador de la organización activa,
 * que llega como parámetro de ruta: así el mismo mapa de navegación sirve para
 * todas las organizaciones de la cuenta.
 */
@Component({
  selector: 'rly-organization-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShell],
  host: { class: 'block' },
  template: `
    <rly-app-shell
      [navItems]="nav()"
      [secondaryNavItems]="secondaryNav()"
      [mobileNavItems]="mobileNav()"
      navLabel="Navegación de la organización"
      [notificationsLink]="'/app/organization/' + organizationId() + '/notificaciones'"
      [notificationsAudience]="organizationId()"
      [title]="title()"
    />
  `,
})
export class OrganizationShell {
  private readonly router = inject(Router);

  readonly organizationId = input.required<string>();

  protected readonly nav = computed(() =>
    withOrganization(ORGANIZATION_NAV, this.organizationId()),
  );
  protected readonly secondaryNav = computed(() =>
    withOrganization(ORGANIZATION_SECONDARY_NAV, this.organizationId()),
  );
  protected readonly mobileNav = computed(() =>
    withOrganization(ORGANIZATION_MOBILE_NAV, this.organizationId()),
  );

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly title = computed(() => {
    const url = this.url();
    const match = [...this.nav(), ...this.secondaryNav()].find((item) => url.startsWith(item.link));
    return match?.label ?? 'Overview';
  });
}
