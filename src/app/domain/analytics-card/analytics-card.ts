import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Contenedor de un bloque de analítica.
 *
 * Cada gráfico de RELAY responde una pregunta concreta, así que la tarjeta
 * obliga a enunciarla: el título es la pregunta y la descripción, la lectura.
 */
@Component({
  selector: 'rly-analytics-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col rounded-lg border border-border bg-surface' },
  template: `
    <header class="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
      <div class="min-w-0">
        <h3 class="text-title-xs text-ink">{{ title() }}</h3>
        @if (description()) {
          <p class="mt-1 text-ui-sm text-text-secondary">{{ description() }}</p>
        }
      </div>

      <div class="shrink-0 empty:hidden">
        <ng-content select="[cardActions]" />
      </div>
    </header>

    <div class="flex-1 p-5">
      <ng-content />
    </div>
  `,
})
export class AnalyticsCard {
  readonly title = input.required<string>();
  readonly description = input('');
}
