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

const BASE =
  'block w-full rounded-md border bg-surface text-ui text-ink transition-colors duration-micro ' +
  'ease-standard placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed ' +
  'disabled:bg-surface-muted disabled:text-text-muted read-only:bg-surface-muted';

const VALID =
  'border-border hover:border-border-strong focus:border-ink focus:ring-1 focus:ring-ink';

const INVALID =
  'border-danger hover:border-danger-strong focus:border-danger-strong focus:ring-1 ' +
  'focus:ring-danger-strong';

/**
 * Campo de texto de una línea, aplicado sobre un `<input>` nativo.
 *
 * Al ser un selector de atributo, `formControlName`, `type`, `autocomplete`,
 * `inputmode` y la validación del navegador siguen funcionando sin envoltorios.
 */
@Directive({
  selector: 'input[rlyInput]',
  host: {
    '[class]': 'classes()',
    '[id]': 'controlId()',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'field?.hasError() ? "true" : null',
    '[attr.aria-required]': 'field?.required() ? "true" : null',
  },
})
export class InputField {
  protected readonly field = inject(FieldContext, { optional: true });

  /** Altura compacta para barras de filtros y celdas de tabla. */
  readonly compact = input(false, { transform: booleanAttribute });

  /** Reserva espacio a la izquierda para un icono superpuesto. */
  readonly withLeadingIcon = input(false, { transform: booleanAttribute });

  /** Reserva espacio a la derecha para una acción superpuesta. */
  readonly withTrailingIcon = input(false, { transform: booleanAttribute });

  protected readonly controlId = computed(() => this.field?.controlId() ?? null);

  protected readonly classes = computed(() =>
    [
      BASE,
      this.field?.hasError() ? INVALID : VALID,
      this.compact() ? 'h-9 px-3' : 'h-11 px-3.5',
      this.withLeadingIcon() ? 'pl-10' : '',
      this.withTrailingIcon() ? 'pr-10' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}

/**
 * Área de texto. Comparte estilos con el input pero crece en vertical, por lo
 * que la altura se controla con `rows` en lugar de con una clase fija.
 */
@Directive({
  selector: 'textarea[rlyTextarea]',
  host: {
    '[class]': 'classes()',
    '[id]': 'controlId()',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'field?.hasError() ? "true" : null',
    '[attr.aria-required]': 'field?.required() ? "true" : null',
  },
})
export class TextareaField {
  protected readonly field = inject(FieldContext, { optional: true });

  protected readonly controlId = computed(() => this.field?.controlId() ?? null);

  protected readonly classes = computed(() =>
    [BASE, this.field?.hasError() ? INVALID : VALID, 'min-h-24 resize-y px-3.5 py-2.5 leading-6']
      .filter(Boolean)
      .join(' '),
  );
}

/**
 * Campo de búsqueda con icono e indicador de limpieza.
 *
 * Es el único control compuesto del sistema porque el patrón se repite en
 * marketplace, aplicaciones, afiliados y conversiones; el resto de campos se
 * componen en la propia vista.
 */
@Component({
  selector: 'rly-search-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'relative block' },
  template: `
    <span
      class="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center
             text-text-muted"
    >
      <rly-icon name="search" [size]="16" />
    </span>
    <ng-content />
  `,
})
export class SearchInput {}
