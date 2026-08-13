import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/**
 * Casilla de verificación sobre el `<input type="checkbox">` nativo.
 *
 * El estado marcado se pinta con Ink y la marca en Relay Acid, de modo que la
 * casilla activa es legible sobre Canvas y sobre Surface sin depender del
 * color como única señal (el texto de la etiqueta siempre acompaña).
 */
@Directive({
  selector: 'input[type=checkbox][rlyCheckbox]',
  host: {
    class:
      'peer size-[1.125rem] shrink-0 cursor-pointer appearance-none rounded-xs border border-border ' +
      'bg-surface bg-center bg-no-repeat transition-[background-color,border-color] ' +
      'duration-micro ease-standard hover:border-border-strong ' +
      'checked:border-ink checked:bg-ink indeterminate:border-ink indeterminate:bg-ink ' +
      'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 ' +
      'checked:bg-[image:var(--rly-check-mark)] indeterminate:bg-[image:var(--rly-check-dash)]',
  },
})
export class Checkbox {}

/** Botón de opción sobre el `<input type="radio">` nativo. */
@Directive({
  selector: 'input[type=radio][rlyRadio]',
  host: {
    class:
      'peer size-[1.125rem] shrink-0 cursor-pointer appearance-none rounded-full border ' +
      'border-border bg-surface transition-[background-color,border-color,box-shadow] ' +
      'duration-micro ease-standard hover:border-border-strong ' +
      'checked:border-ink checked:bg-ink checked:shadow-[inset_0_0_0_3px_var(--rly-color-accent)] ' +
      'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60',
  },
})
export class Radio {}

/**
 * Interruptor de dos estados.
 *
 * Usa `<input type="checkbox" role="switch">` para conservar el
 * comportamiento nativo (teclado, formularios, `formControlName`) y anunciar
 * la semántica correcta.
 */
@Component({
  selector: 'rly-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <span class="relative inline-flex items-center">
      <ng-content />
      <span
        class="pointer-events-none absolute left-0.5 size-4 rounded-full bg-surface shadow-xs
               transition-[transform,background-color] duration-micro ease-standard
               peer-checked:translate-x-4 peer-checked:bg-accent"
        aria-hidden="true"
      ></span>
    </span>
  `,
})
export class Switch {
  /** Solo documental: el estado vive en el `<input>` proyectado. */
  readonly label = input('');
}

/** Pista del interruptor, aplicada al `<input type="checkbox" role="switch">`. */
@Directive({
  selector: 'input[type=checkbox][rlySwitch]',
  host: {
    role: 'switch',
    class:
      'peer h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full border border-border ' +
      'bg-surface-muted transition-colors duration-micro ease-standard ' +
      'checked:border-ink checked:bg-ink ' +
      'disabled:cursor-not-allowed disabled:opacity-60',
  },
})
export class SwitchInput {}
