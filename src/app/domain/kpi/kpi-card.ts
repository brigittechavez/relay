import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Icon } from '@ds/icon/icon';
import { Tooltip } from '@ds/tooltip/tooltip';
import { DeltaPipe } from '@shared/pipes/format.pipes';

/**
 * Cifra principal de un panel.
 *
 * La variación se muestra con signo, con flecha y con la palabra del periodo:
 * una flecha verde por sí sola no dice respecto a qué. Cuando no hay periodo
 * anterior con el que comparar, no se inventa un 0%.
 */
@Component({
  selector: 'rly-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Tooltip, DeltaPipe],
  host: { class: 'block rounded-lg border border-border bg-surface p-5' },
  template: `
    <div class="flex items-start justify-between gap-3">
      <p class="text-ui-sm text-text-secondary">{{ label() }}</p>

      @if (hint()) {
        <span
          class="focus-ring -m-1 rounded-full p-1 text-text-muted"
          tabindex="0"
          [rlyTooltip]="hint()"
        >
          <rly-icon name="help-circle" [size]="14" />
        </span>
      }
    </div>

    <p class="mt-2 text-kpi text-ink">{{ value() }}</p>

    <div class="mt-2 flex items-center gap-1.5">
      @if (delta() !== null) {
        <rly-icon
          [name]="isUp() ? 'trending-up' : 'trending-down'"
          [size]="14"
          [class]="deltaClasses()"
        />
        <span [class]="deltaClasses()" class="text-ui-sm font-medium tabular-nums">
          {{ delta() | rlyDelta }}
        </span>
      }

      @if (caption()) {
        <span class="text-ui-sm text-text-muted">{{ caption() }}</span>
      }
    </div>
  `,
})
export class KpiCard {
  readonly label = input.required<string>();
  /** Valor ya formateado: la tarjeta no decide cómo se presenta un importe. */
  readonly value = input.required<string>();

  /** Variación porcentual. `null` cuando no hay comparación posible. */
  readonly delta = input<number | null>(null);

  /** Texto del periodo, por ejemplo «vs. 30 días anteriores». */
  readonly caption = input('');

  /** Explicación breve del dato, en un tooltip accesible. */
  readonly hint = input('');

  /**
   * Invierte la lectura de la variación. En «comisiones pendientes» o
   * «solicitudes por revisar», subir no es una buena noticia.
   */
  readonly inverted = input(false);

  protected readonly isUp = computed(() => (this.delta() ?? 0) >= 0);

  protected readonly deltaClasses = computed(() => {
    const positive = this.inverted() ? !this.isUp() : this.isUp();
    return positive ? 'text-success-strong' : 'text-danger-strong';
  });
}
