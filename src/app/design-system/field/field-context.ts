import { computed, Injectable, signal } from '@angular/core';

let sequence = 0;

/**
 * Puente entre `rly-field` y el control que contiene.
 *
 * El campo posee la etiqueta, la ayuda y el error; el control necesita conocer
 * sus identificadores para enlazarlos con `for`, `aria-describedby` y
 * `aria-invalid`. En lugar de obligar a repetir esos ids en cada plantilla, el
 * campo los publica aquí y el control los consume por inyección.
 */
@Injectable()
export class FieldContext {
  private readonly uid = `rly-field-${++sequence}`;

  readonly controlId = signal(this.uid);
  readonly hasHint = signal(false);
  readonly hasError = signal(false);
  readonly required = signal(false);

  readonly hintId = computed(() => `${this.controlId()}-hint`);
  readonly errorId = computed(() => `${this.controlId()}-error`);

  /** Ids que el control debe anunciar, en el orden en que se leen. */
  readonly describedBy = computed(() => {
    const ids = [
      this.hasHint() ? this.hintId() : null,
      this.hasError() ? this.errorId() : null,
    ].filter(Boolean);

    return ids.length ? ids.join(' ') : null;
  });
}
