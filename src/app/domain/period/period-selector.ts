import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { PeriodId, PERIODS } from '@data/models/common';

/**
 * Selector de periodo.
 *
 * Cinco opciones fijas y ningún calendario: RELAY no necesita rangos
 * arbitrarios, y un date picker completo añadiría una superficie de interacción
 * que ninguna pregunta de estas pantallas requiere.
 *
 * En móvil es un desplegable nativo; en escritorio, un grupo de botones donde
 * el periodo activo se ve sin desplegar nada.
 */
@Component({
  selector: 'rly-period-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <!-- Escritorio -->
    <div
      class="hidden rounded-md border border-border bg-surface p-0.5 sm:inline-flex"
      role="group"
      [attr.aria-label]="ariaLabel()"
    >
      @for (period of periods; track period.id) {
        <button
          type="button"
          [class]="buttonClasses(period.id)"
          [attr.aria-pressed]="period.id === selected()"
          (click)="selectedChange.emit(period.id)"
        >
          {{ period.label }}
        </button>
      }
    </div>

    <!-- Móvil -->
    <label class="block sm:hidden">
      <span class="sr-only">{{ ariaLabel() }}</span>
      <select
        class="focus-ring h-9 w-full rounded-md border border-border bg-surface px-3 text-ui-sm
               text-ink"
        [value]="selected()"
        (change)="onChange($event)"
      >
        @for (period of periods; track period.id) {
          <option [value]="period.id">{{ period.label }}</option>
        }
      </select>
    </label>
  `,
})
export class PeriodSelector {
  readonly selected = input.required<PeriodId>();
  readonly ariaLabel = input('Periodo');

  readonly selectedChange = output<PeriodId>();

  protected readonly periods = PERIODS;

  protected buttonClasses(id: PeriodId): string {
    return [
      'focus-ring rounded-sm px-3 py-1.5 text-ui-sm font-medium transition-colors duration-micro',
      id === this.selected() ? 'bg-ink text-text-inverse' : 'text-text-secondary hover:text-ink',
    ].join(' ');
  }

  protected onChange(event: Event): void {
    this.selectedChange.emit((event.target as HTMLSelectElement).value as PeriodId);
  }
}

/**
 * Traduce un periodo a la ventana de días y a su etiqueta de comparación.
 *
 * Vive junto al selector porque es su contraparte: sin esto, cada panel
 * tendría que reinterpretar por su cuenta qué significa «mes anterior».
 */
export function periodWindow(id: PeriodId): { days: number; comparison: string; offset: number } {
  switch (id) {
    case '7d':
      return { days: 7, comparison: 'vs. 7 días anteriores', offset: 0 };
    case '90d':
      return { days: 90, comparison: 'vs. 90 días anteriores', offset: 0 };
    case 'this-month':
      return { days: 30, comparison: 'vs. mes anterior', offset: 0 };
    case 'last-month':
      // El mes anterior se lee desplazando la ventana 30 días hacia atrás.
      return { days: 30, comparison: 'vs. dos meses atrás', offset: 30 };
    case '30d':
    default:
      return { days: 30, comparison: 'vs. 30 días anteriores', offset: 0 };
  }
}
