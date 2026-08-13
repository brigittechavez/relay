import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Icon } from '../icon/icon';
import { ToastService, ToastTone } from './toast.service';

const TONE: Record<ToastTone, string> = {
  neutral: 'text-text-inverse',
  success: 'text-accent',
  warning: 'text-warning',
  danger: 'text-danger',
};

/**
 * Contenedor de los avisos. Se monta una sola vez por shell.
 *
 * La región es `aria-live="polite"`: el aviso se anuncia cuando el lector
 * termina lo que está diciendo, sin interrumpir la tarea en curso.
 */
@Component({
  selector: 'rly-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    class:
      'pointer-events-none fixed inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4 ' +
      'sm:bottom-auto sm:top-4 sm:items-end',
    style: 'z-index: var(--rly-z-toast)',
  },
  styles: `
    .rly-toast {
      animation: rly-toast-in var(--rly-duration-ui) var(--rly-ease-out);
    }

    @keyframes rly-toast-in {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
    }
  `,
  template: `
    <div role="status" aria-live="polite" class="contents">
      @for (toast of toasts(); track toast.id) {
        <div
          class="rly-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md
                 bg-ink px-4 py-3 text-ui text-text-inverse shadow-lg"
        >
          @if (toast.icon; as icon) {
            <rly-icon [name]="icon" [size]="18" [class]="toneClass(toast.tone)" class="mt-px" />
          }

          <p class="min-w-0 flex-1">{{ toast.message }}</p>

          @if (toast.action; as action) {
            <button
              type="button"
              class="focus-ring-inverse -my-0.5 shrink-0 rounded-xs px-1 font-medium text-accent
                     underline-offset-4 hover:underline"
              (click)="run(toast.id, action.run)"
            >
              {{ action.label }}
            </button>
          }

          <button
            type="button"
            class="focus-ring-inverse -my-0.5 -mr-1 shrink-0 rounded-xs p-1
                   text-text-inverse-secondary transition-colors hover:text-text-inverse"
            aria-label="Descartar aviso"
            (click)="dismiss(toast.id)"
          >
            <rly-icon name="close" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  private readonly service = inject(ToastService);

  protected readonly toasts = this.service.toasts;

  protected toneClass(tone: ToastTone): string {
    return TONE[tone];
  }

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }

  protected run(id: number, action: () => void): void {
    action();
    this.service.dismiss(id);
  }
}
