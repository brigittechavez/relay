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

export type ModalSize = 'sm' | 'md' | 'lg';

const SIZE: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

/**
 * Diálogo modal.
 *
 * El foco queda atrapado dentro del panel (`cdkTrapFocus` del CDK), Escape
 * cierra, el scroll del documento se bloquea y al cerrarse el foco vuelve al
 * disparador.
 *
 * El componente se renderiza en su lugar del árbol, no en un portal, así que
 * debe colocarse en el nivel superior de la plantilla de la página y no dentro
 * de contenedores que creen contexto de apilamiento (`transform`, `filter`).
 */
@Component({
  selector: 'rly-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule, Button, Icon],
  providers: [OverlayBehavior],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  styles: `
    .rly-modal__backdrop {
      animation: rly-fade-in var(--rly-duration-ui) var(--rly-ease-standard);
    }

    .rly-modal__panel {
      animation: rly-modal-in var(--rly-duration-overlay) var(--rly-ease-out);
    }

    @keyframes rly-fade-in {
      from {
        opacity: 0;
      }
    }

    @keyframes rly-modal-in {
      from {
        opacity: 0;
        transform: translateY(0.75rem) scale(0.99);
      }
    }
  `,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6"
        style="z-index: var(--rly-z-modal)"
      >
        <div
          class="rly-modal__backdrop absolute inset-0 bg-overlay"
          (click)="onBackdrop()"
          aria-hidden="true"
        ></div>

        <div
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="description() ? descriptionId : null"
          [class]="panelClasses()"
        >
          <header class="flex items-start gap-4 border-b border-border px-5 py-4">
            <div class="min-w-0 flex-1">
              <h2 [id]="titleId" class="text-title-xs text-ink">{{ title() }}</h2>
              @if (description()) {
                <p [id]="descriptionId" class="mt-1 text-ui-sm text-text-secondary">
                  {{ description() }}
                </p>
              }
            </div>

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

          <div class="max-h-[min(60vh,32rem)] overflow-y-auto px-5 py-4">
            <ng-content />
          </div>

          <footer
            class="flex flex-col-reverse gap-2 border-t border-border px-5 py-4
                   sm:flex-row sm:justify-end empty:hidden"
          >
            <ng-content select="[modalFooter]" />
          </footer>
        </div>
      </div>
    }
  `,
})
export class Modal {
  private readonly behavior = inject(OverlayBehavior);
  private static sequence = 0;
  private readonly uid = `rly-modal-${++Modal.sequence}`;

  protected readonly titleId = `${this.uid}-title`;
  protected readonly descriptionId = `${this.uid}-description`;

  readonly open = input(false, { transform: booleanAttribute });
  readonly title = input.required<string>();
  readonly description = input('');
  readonly size = input<ModalSize>('md');

  /** Desactiva el cierre al pulsar fuera. Útil en pasos que no deben perderse. */
  readonly persistent = input(false, { transform: booleanAttribute });

  readonly closed = output<void>();

  constructor() {
    effect(() => this.behavior.open.set(this.open()));
  }

  protected readonly panelClasses = computed(() =>
    [
      'rly-modal__panel relative flex w-full flex-col overflow-hidden bg-surface shadow-lg',
      'rounded-t-xl sm:rounded-lg',
      SIZE[this.size()],
    ].join(' '),
  );

  protected onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

  protected onBackdrop(): void {
    if (!this.persistent()) {
      this.closed.emit();
    }
  }
}
