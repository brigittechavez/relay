import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { Icon } from '../icon/icon';
import { IconName } from '../icon/icon-registry.generated';

/**
 * Chip de filtro.
 *
 * Se renderiza como `<button>` con `aria-pressed`, que es la semántica correcta
 * para un filtro que se activa y desactiva. Cuando además es descartable,
 * expone un segundo control con su propio nombre accesible.
 */
@Component({
  selector: 'rly-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  // `shrink-0`: en una fila con desplazamiento horizontal, un chip que se
  // encoge parte su etiqueta en dos líneas y la recorta contra su altura fija.
  host: { class: 'inline-flex shrink-0' },
  template: `
    <button
      type="button"
      [class]="classes()"
      [attr.aria-pressed]="selected()"
      [disabled]="disabled()"
      (click)="toggled.emit(!selected())"
    >
      @if (icon(); as iconName) {
        <rly-icon [name]="iconName" [size]="14" />
      }
      <ng-content />
      @if (count() !== null) {
        <span [class]="countClasses()">{{ count() }}</span>
      }
    </button>

    @if (removable()) {
      <button
        type="button"
        class="focus-ring -ml-px flex h-8 w-7 items-center justify-center rounded-r-full border
               border-l-0 border-border bg-surface text-text-secondary transition-colors
               duration-micro hover:bg-surface-muted hover:text-ink"
        [attr.aria-label]="'Quitar filtro ' + label()"
        (click)="removed.emit()"
      >
        <rly-icon name="close" [size]="14" />
      </button>
    }
  `,
})
export class Chip {
  readonly selected = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly removable = input(false, { transform: booleanAttribute });

  /** Icono opcional a la izquierda del texto. */
  readonly icon = input<IconName | null>(null);

  /** Número de resultados asociados al filtro, si el contexto lo aporta. */
  readonly count = input<number | null>(null);

  /** Texto del chip. Solo se usa para nombrar el botón de descarte. */
  readonly label = input('');

  readonly toggled = output<boolean>();
  readonly removed = output<void>();

  protected readonly countClasses = computed(() =>
    this.selected() ? 'tabular-nums text-text-inverse-secondary' : 'tabular-nums text-text-muted',
  );

  protected readonly classes = computed(() =>
    [
      'focus-ring inline-flex h-8 items-center gap-1.5 whitespace-nowrap border px-3 text-ui-sm',
      'font-medium',
      'transition-colors duration-micro ease-standard disabled:pointer-events-none',
      'disabled:opacity-45',
      this.removable() ? 'rounded-l-full' : 'rounded-full',
      this.selected()
        ? 'border-ink bg-ink text-text-inverse'
        : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-ink',
    ].join(' '),
  );
}
