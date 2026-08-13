import { A11yModule } from '@angular/cdk/a11y';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { OverlayBehavior } from '../overlay/overlay-behavior';

/**
 * `responsive` es el modo por defecto de RELAY: hoja inferior en móvil y panel
 * lateral en escritorio, que es el patrón que piden los filtros del
 * marketplace y las aplicaciones a campañas selectivas.
 */
export type DrawerSide = 'responsive' | 'right' | 'bottom';

/**
 * Panel deslizante.
 *
 * Comparte con el modal el atrapado de foco, el cierre con Escape, el bloqueo
 * de scroll y la devolución del foco; cambia la posición y la animación.
 */
@Component({
  selector: 'rly-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule, Button, Icon],
  providers: [OverlayBehavior],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  styles: `
    .rly-drawer__backdrop {
      animation: rly-fade-in var(--rly-duration-ui) var(--rly-ease-standard);
    }

    .rly-drawer__panel--bottom {
      animation: rly-drawer-up var(--rly-duration-overlay) var(--rly-ease-out);
    }

    .rly-drawer__panel--right {
      animation: rly-drawer-in var(--rly-duration-overlay) var(--rly-ease-out);
    }

    /* En el modo responsive la posición la resuelven las utilidades y la
       animación cambia aquí, porque un keyframe no se puede seleccionar por
       breakpoint desde una clase de utilidad. */
    .rly-drawer__panel--responsive {
      animation: rly-drawer-up var(--rly-duration-overlay) var(--rly-ease-out);
    }

    @media (width >= 40rem) {
      .rly-drawer__panel--responsive {
        animation-name: rly-drawer-in;
      }
    }

    @keyframes rly-fade-in {
      from {
        opacity: 0;
      }
    }

    @keyframes rly-drawer-up {
      from {
        transform: translateY(100%);
      }
    }

    @keyframes rly-drawer-in {
      from {
        transform: translateX(100%);
      }
    }
  `,
  template: `
    @if (open()) {
      <div class="fixed inset-0" style="z-index: var(--rly-z-drawer)">
        <div
          class="rly-drawer__backdrop absolute inset-0 bg-overlay"
          (click)="closed.emit()"
          aria-hidden="true"
        ></div>

        <div
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [class]="panelClasses()"
        >
          <header class="flex items-center gap-4 border-b border-border px-5 py-4">
            <h2 [id]="titleId" class="min-w-0 flex-1 text-title-xs text-ink">{{ title() }}</h2>
            <button
              rlyButton
              variant="ghost"
              size="sm"
              iconOnly
              type="button"
              aria-label="Cerrar"
              (click)="closed.emit()"
            >
              <rly-icon name="close" [size]="18" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto px-5 py-4">
            <ng-content />
          </div>

          <footer
            class="flex gap-2 border-t border-border bg-surface px-5 py-4
                   pb-[max(1rem,env(safe-area-inset-bottom))] empty:hidden"
          >
            <ng-content select="[drawerFooter]" />
          </footer>
        </div>
      </div>
    }
  `,
})
export class Drawer {
  private readonly behavior = inject(OverlayBehavior);
  private static sequence = 0;

  protected readonly titleId = `rly-drawer-${++Drawer.sequence}-title`;

  readonly open = input(false, { transform: booleanAttribute });
  readonly title = input.required<string>();
  readonly side = input<DrawerSide>('responsive');

  readonly closed = output<void>();

  constructor() {
    effect(() => this.behavior.open.set(this.open()));
  }

  protected readonly panelClasses = computed(() => {
    const side = this.side();
    const base = 'absolute flex flex-col bg-surface shadow-lg';

    if (side === 'bottom') {
      return `${base} rly-drawer__panel--bottom inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl`;
    }

    if (side === 'right') {
      return `${base} rly-drawer__panel--right inset-y-0 right-0 w-full max-w-md`;
    }

    return (
      `${base} rly-drawer__panel--responsive inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl ` +
      'sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none'
    );
  });

  protected onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }
}
