import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { AppShell } from '@core/layout/app-shell';
import {
  AFFILIATE_MOBILE_NAV,
  AFFILIATE_NAV,
  AFFILIATE_SECONDARY_NAV,
} from '@core/navigation/navigation';

/**
 * Área del afiliado.
 *
 * Solo aporta la configuración de navegación y el título de la vista actual:
 * la estructura vive en `AppShell`, compartida con el área de organización.
 */
@Component({
  selector: 'rly-affiliate-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShell],
  host: { class: 'block' },
  template: `
    <rly-app-shell
      [navItems]="nav"
      [secondaryNavItems]="secondaryNav"
      [mobileNavItems]="mobileNav"
      navLabel="Navegación de afiliado"
      notificationsLink="/app/affiliate/notificaciones"
      notificationsAudience="affiliate"
      [title]="title()"
    />
  `,
})
export class AffiliateShell {
  private readonly router = inject(Router);

  protected readonly nav = AFFILIATE_NAV;
  protected readonly secondaryNav = AFFILIATE_SECONDARY_NAV;
  protected readonly mobileNav = AFFILIATE_MOBILE_NAV;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Título derivado del destino activo, sin duplicarlo en cada página. */
  protected readonly title = computed(() => {
    const url = this.url();
    const match = [...this.nav, ...this.secondaryNav].find((item) => url.startsWith(item.link));
    return match?.label ?? 'Inicio';
  });
}
