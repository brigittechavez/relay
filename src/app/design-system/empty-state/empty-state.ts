import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';
import { IconName } from '../icon/icon-registry.generated';

/**
 * Estado vacío.
 *
 * Un icono, un titular corto, una frase y —cuando existe— una única acción.
 * RELAY no usa ilustraciones: el vacío se resuelve con texto que explica qué
 * falta y qué hacer a continuación.
 */
@Component({
  selector: 'rly-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'flex flex-col items-center px-6 py-12 text-center' },
  template: `
    <span
      class="mb-4 flex size-11 items-center justify-center rounded-md border border-border
             bg-surface-muted text-text-secondary"
    >
      <rly-icon [name]="icon()" [size]="20" />
    </span>

    <p class="text-title-xs text-ink">{{ title() }}</p>

    @if (description()) {
      <p class="mt-1.5 max-w-sm text-ui text-text-secondary">{{ description() }}</p>
    }

    <div class="mt-5 empty:hidden">
      <ng-content />
    </div>
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('inbox');
  readonly title = input.required<string>();
  readonly description = input('');
}
