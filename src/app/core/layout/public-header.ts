import { isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';
import { Logo } from '@ds/logo/logo';
import { PUBLIC_NAV } from '../navigation/navigation';

/**
 * Cabecera del área pública.
 *
 * Sobre el hero oscuro de la portada arranca transparente y se compacta al
 * hacer scroll; en el resto de páginas es sólida desde el principio. El menú
 * móvil es un panel a pantalla completa, no un drawer: con cuatro destinos y
 * dos acciones no hace falta más estructura.
 */
@Component({
  selector: 'rly-public-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Button, Icon, Logo],
  host: {
    class: 'sticky top-0 block',
    style: 'z-index: var(--rly-z-header)',
    '(window:scroll)': 'onScroll()',
  },
  template: `
    <div [class]="barClasses()">
      <div class="container-page flex items-center justify-between gap-6" [class]="heightClasses()">
        <a routerLink="/" class="focus-ring rounded-sm">
          <rly-logo [onInverse]="isOverHero()" />
        </a>

        <nav class="hidden items-center gap-1 lg:flex" aria-label="Principal">
          @for (item of nav; track item.link) {
            <a
              [routerLink]="item.link"
              routerLinkActive
              #active="routerLinkActive"
              [attr.aria-current]="active.isActive ? 'page' : null"
              [class]="linkClasses(active.isActive)"
            >
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="hidden items-center gap-2 lg:flex">
          <a rlyButton variant="ghost" size="sm" [onInverse]="isOverHero()" routerLink="/login">
            Iniciar sesión
          </a>
          <a
            rlyButton
            variant="primary"
            size="sm"
            [onInverse]="isOverHero()"
            routerLink="/registro"
          >
            Crear cuenta
          </a>
        </div>

        <button
          rlyButton
          variant="ghost"
          size="sm"
          iconOnly
          type="button"
          class="lg:hidden"
          [onInverse]="isOverHero()"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="rly-public-menu"
          [attr.aria-label]="menuOpen() ? 'Cerrar menú' : 'Abrir menú'"
          (click)="menuOpen.set(!menuOpen())"
        >
          <rly-icon [name]="menuOpen() ? 'close' : 'menu'" [size]="20" />
        </button>
      </div>
    </div>

    @if (menuOpen()) {
      <div id="rly-public-menu" class="border-b border-border bg-surface px-5 pb-6 pt-2 lg:hidden">
        <nav aria-label="Principal (móvil)">
          <ul class="flex flex-col">
            @for (item of nav; track item.link) {
              <li>
                <a
                  [routerLink]="item.link"
                  routerLinkActive="text-ink"
                  class="focus-ring block rounded-sm py-3 text-title-xs text-text-secondary"
                  (click)="menuOpen.set(false)"
                >
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <div class="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          <a rlyButton variant="tertiary" block routerLink="/login" (click)="menuOpen.set(false)">
            Iniciar sesión
          </a>
          <a rlyButton variant="primary" block routerLink="/registro" (click)="menuOpen.set(false)">
            Crear cuenta
          </a>
        </div>
      </div>
    }
  `,
})
export class PublicHeader {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly nav = PUBLIC_NAV;
  protected readonly menuOpen = signal(false);
  protected readonly scrolled = signal(false);

  /** La página tiene un hero Ink a sangre bajo la cabecera. */
  readonly overHero = input(false, { transform: booleanAttribute });

  /** La cabecera se comporta como oscura solo mientras cubre el hero. */
  protected readonly isOverHero = computed(
    () => this.overHero() && !this.scrolled() && !this.menuOpen(),
  );

  protected readonly barClasses = computed(() =>
    [
      'transition-[background-color,border-color,backdrop-filter] duration-ui ease-standard',
      this.isOverHero()
        ? 'border-b border-transparent bg-transparent'
        : 'border-b border-border bg-canvas/90 backdrop-blur-sm',
    ].join(' '),
  );

  protected readonly heightClasses = computed(() =>
    this.scrolled() ? 'h-header-compact' : 'h-header',
  );

  protected onScroll(): void {
    if (!this.isBrowser) return;
    this.scrolled.set(window.scrollY > 24);
  }

  protected linkClasses(isActive: boolean): string {
    const base = 'focus-ring rounded-sm px-3 py-2 text-ui transition-colors duration-micro';

    if (this.isOverHero()) {
      return `${base} ${isActive ? 'text-text-inverse' : 'text-text-inverse-secondary hover:text-text-inverse'}`;
    }

    return `${base} ${isActive ? 'text-ink' : 'text-text-secondary hover:text-ink'}`;
  }
}
