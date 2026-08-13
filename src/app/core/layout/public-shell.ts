import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { ToastHost } from '@ds/toast/toast-host';
import { PublicFooter } from './public-footer';
import { PublicHeader } from './public-header';

/**
 * Estructura del área pública: cabecera, contenido y pie.
 *
 * La cabecera cambia de tratamiento según la ruta activa. En lugar de que cada
 * página lo comunique hacia arriba, las rutas lo declaran en su `data` y el
 * shell lo lee: la decisión queda junto a la definición de la ruta.
 */
@Component({
  selector: 'rly-public-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, PublicHeader, PublicFooter, ToastHost],
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <a
      href="#contenido"
      class="sr-only-focusable focus-ring absolute left-4 top-4 z-50 rounded-sm bg-ink px-4 py-2
             text-ui text-text-inverse"
    >
      Saltar al contenido
    </a>

    <rly-public-header [overHero]="overHero()" />

    <main id="contenido" class="flex-1">
      <router-outlet />
    </main>

    <rly-public-footer />
    <rly-toast-host />
  `,
})
export class PublicShell {
  private readonly router = inject(Router);

  private readonly routeData = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.activeRouteData()),
    ),
    { initialValue: {} as Record<string, unknown> },
  );

  protected readonly overHero = computed(() => this.routeData()['overHero'] === true);

  /**
   * Datos de la ruta hoja activa.
   *
   * Se lee del snapshot del router y no del árbol de `ActivatedRoute`, porque
   * durante el prerender las rutas hijas todavía no tienen snapshot propio
   * cuando el shell se construye.
   */
  private activeRouteData(): Record<string, unknown> {
    let snapshot: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;

    while (snapshot?.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot?.data ?? {};
  }
}
