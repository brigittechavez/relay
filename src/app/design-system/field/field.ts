import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';

import { Icon } from '../icon/icon';
import { FieldContext } from './field-context';

/**
 * Envoltorio de un control de formulario: etiqueta, ayuda y error.
 *
 * Uso:
 * ```html
 * <rly-field label="Nombre de la campaña" hint="Visible en el marketplace" required>
 *   <input rlyInput formControlName="name" />
 * </rly-field>
 * ```
 *
 * El error se muestra siempre como texto —nunca solo con color de borde— y se
 * anuncia a los lectores de pantalla mediante `aria-describedby`.
 */
@Component({
  selector: 'rly-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  providers: [FieldContext],
  host: { class: 'block' },
  template: `
    @if (label()) {
      <label
        [for]="context.controlId()"
        class="mb-1.5 flex items-center gap-1 text-ui-sm font-medium text-ink"
      >
        {{ label() }}
        @if (required()) {
          <span class="text-danger" aria-hidden="true">*</span>
          <span class="sr-only">(obligatorio)</span>
        }
        @if (optionalHint()) {
          <span class="font-normal text-text-muted">· opcional</span>
        }
      </label>
    }

    <ng-content />

    @if (hint() && !error()) {
      <p [id]="context.hintId()" class="mt-1.5 text-ui-sm text-text-secondary">{{ hint() }}</p>
    }

    @if (error(); as message) {
      <p
        [id]="context.errorId()"
        class="mt-1.5 flex items-start gap-1.5 text-ui-sm text-danger-strong"
      >
        <rly-icon name="alert" [size]="14" class="mt-px" />
        <span>{{ message }}</span>
      </p>
    }
  `,
})
export class Field {
  protected readonly context = inject(FieldContext);

  readonly label = input('');
  readonly hint = input('');

  /** Mensaje de error. Su presencia marca el control como inválido. */
  readonly error = input<string | null>(null);

  readonly required = input(false, { transform: booleanAttribute });

  /** Marca explícitamente el campo como opcional cuando el resto no lo es. */
  readonly optionalHint = input(false, { transform: booleanAttribute });

  constructor() {
    effect(() => {
      this.context.hasHint.set(!!this.hint() && !this.error());
      this.context.hasError.set(!!this.error());
      this.context.required.set(this.required());
    });
  }
}
