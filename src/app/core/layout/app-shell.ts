import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { Drawer } from '@ds/drawer/drawer';
import { Icon } from '@ds/icon/icon';
import { Logo } from '@ds/logo/logo';
import { ToastHost } from '@ds/toast/toast-host';
import { Tooltip } from '@ds/tooltip/tooltip';
import { NavItem } from '../navigation/navigation';
import { AppBottomNav } from './app-bottom-nav';
import { AppSidebar } from './app-sidebar';
import { DemoControls } from '../session/demo-controls';
import { WorkspaceSwitcher } from './workspace-switcher';

const SIDEBAR_STORAGE_KEY = 'relay:sidebar-collapsed';

/**
 * Estructura de las áreas autenticadas.
 *
 * En escritorio hay barra lateral plegable; en móvil desaparece y se sustituye
 * por navegación inferior más un panel «Más» con el resto de destinos. La
 * preferencia de plegado se conserva entre sesiones.
 */
@Component({
  selector: 'rly-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    AppSidebar,
    AppBottomNav,
    WorkspaceSwitcher,
    DemoControls,
    Badge,
    Button,
    Drawer,
    Icon,
    Logo,
    ToastHost,
    Tooltip,
  ],
  host: { class: 'block min-h-dvh bg-canvas' },
  template: `
    <a
      href="#contenido"
      class="sr-only-focusable focus-ring absolute left-4 top-4 z-50 rounded-sm bg-ink px-4 py-2
             text-ui text-text-inverse"
    >
      Saltar al contenido
    </a>

    <div class="flex">
      <!-- Barra lateral (escritorio) -->
      <div
        [class]="asideClasses()"
        class="sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 border-r border-border
               bg-surface px-3 py-4 lg:flex"
      >
        <div class="flex items-center" [class.justify-center]="collapsed()">
          <a routerLink="/" class="focus-ring rounded-sm">
            <rly-logo [variant]="collapsed() ? 'mark' : 'full'" />
          </a>
        </div>

        @if (!collapsed()) {
          <rly-workspace-switcher />
        }

        <rly-app-sidebar
          [items]="navItems()"
          [secondaryItems]="secondaryNavItems()"
          [collapsed]="collapsed()"
          [ariaLabel]="navLabel()"
          class="flex-1"
        />

        <button
          rlyButton
          variant="ghost"
          size="sm"
          type="button"
          [iconOnly]="collapsed()"
          [rlyTooltip]="collapsed() ? 'Expandir barra lateral' : ''"
          [attr.aria-label]="collapsed() ? 'Expandir barra lateral' : 'Plegar barra lateral'"
          (click)="toggleCollapsed()"
        >
          <rly-icon [name]="collapsed() ? 'chevron-right' : 'chevron-left'" [size]="16" />
          @if (!collapsed()) {
            <span>Plegar</span>
          }
        </button>
      </div>

      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Cabecera -->
        <header
          class="sticky top-0 flex h-header items-center gap-3 border-b border-border
                 bg-canvas/90 px-4 backdrop-blur-sm lg:px-6"
          style="z-index: var(--rly-z-header)"
        >
          <a routerLink="/" class="focus-ring rounded-sm lg:hidden">
            <rly-logo variant="mark" />
          </a>

          <div class="min-w-0 flex-1">
            <h1 class="truncate text-title-xs text-ink">{{ title() }}</h1>
          </div>

          <rly-badge tone="accent" class="hidden sm:inline-flex">Modo demo</rly-badge>

          <a
            rlyButton
            variant="ghost"
            size="sm"
            iconOnly
            [routerLink]="notificationsLink()"
            aria-label="Notificaciones"
            rlyTooltip="Notificaciones"
          >
            <rly-icon name="bell" [size]="18" />
          </a>
        </header>

        <main id="contenido" class="flex-1 pb-bottom-nav lg:pb-0">
          <router-outlet />
        </main>
      </div>
    </div>

    <rly-app-bottom-nav [items]="mobileNavItems()" (moreRequested)="moreOpen.set(true)" />

    <rly-drawer [open]="moreOpen()" title="Más" side="bottom" (closed)="moreOpen.set(false)">
      <rly-workspace-switcher class="mb-4" />
      <rly-app-sidebar
        [items]="overflowNavItems()"
        [secondaryItems]="secondaryNavItems()"
        ariaLabel="Más destinos"
      />
      <rly-demo-controls class="mt-4" />
    </rly-drawer>

    <rly-toast-host />
  `,
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly navItems = input.required<readonly NavItem[]>();
  readonly secondaryNavItems = input<readonly NavItem[]>([]);
  readonly mobileNavItems = input.required<readonly NavItem[]>();
  readonly navLabel = input('Navegación del área de trabajo');
  readonly notificationsLink = input.required<string>();

  /** Título de la vista actual, mostrado en la cabecera. */
  readonly title = input('');

  protected readonly moreOpen = signal(false);
  protected readonly collapsed = signal(this.readCollapsed());

  /** Destinos que la bottom nav no muestra y que van al panel «Más». */
  protected readonly overflowNavItems = computed(() => {
    const inBottomNav = new Set(this.mobileNavItems().map((item) => item.link));
    return this.navItems().filter((item) => !inBottomNav.has(item.link));
  });

  protected readonly asideClasses = computed(() =>
    this.collapsed() ? 'w-sidebar-collapsed' : 'w-sidebar',
  );

  constructor() {
    // Navegar cierra el panel «Más»: en móvil el destino ya cambió.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.moreOpen.set(false));
  }

  protected toggleCollapsed(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);

    if (this.isBrowser) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    }
  }

  private readCollapsed(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  }
}
