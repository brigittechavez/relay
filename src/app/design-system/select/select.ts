import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
} from '@angular/core';

import { FieldContext } from '../field/field-context';
import { Icon } from '../icon/icon';

/**
 * Desplegable, aplicado sobre un `<select>` nativo.
 *
 * RELAY no reimplementa el listbox: el control nativo aporta teclado, búsqueda
 * por escritura y la hoja nativa en móvil, que es mejor experiencia que
 * cualquier overlay propio. Solo se reemplaza su apariencia.
 */
@Directive({
  selector: 'select[rlySelect]',
  host: {
    '[class]': 'classes()',
    '[id]': 'controlId()',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'field?.hasError() ? "true" : null',
    '[attr.aria-required]': 'field?.required() ? "true" : null',
  },
})
export class SelectField {
  protected readonly field = inject(FieldContext, { optional: true });

  readonly compact = input(false, { transform: booleanAttribute });

  protected readonly controlId = computed(() => this.field?.controlId() ?? null);

  protected readonly classes = computed(() =>
    [
      'block w-full appearance-none rounded-md border bg-surface pr-9 text-ui text-ink',
      'transition-colors duration-micro ease-standard focus:outline-none',
      'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
      this.field?.hasError()
        ? 'border-danger focus:border-danger-strong focus:ring-1 focus:ring-danger-strong'
        : 'border-border hover:border-border-strong focus:border-ink focus:ring-1 focus:ring-ink',
      this.compact() ? 'h-9 pl-3' : 'h-11 pl-3.5',
    ].join(' '),
  );
}

/**
 * Contenedor que superpone el indicador de desplegable al `<select>`.
 * Se separa del directivo porque el chevron necesita un elemento propio.
 */
@Component({
  selector: 'rly-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'relative block' },
  template: `
    <ng-content />
    <span
      class="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center
             text-text-secondary"
    >
      <rly-icon name="chevron-down" [size]="16" />
    </span>
  `,
})
export class Select {}
