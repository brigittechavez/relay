import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type MatchSize = 'sm' | 'md' | 'lg';

/**
 * Indicador de compatibilidad.
 *
 * El porcentaje siempre va acompañado de la palabra «match» y, en los tamaños
 * grandes, de una lectura en palabras: un anillo de color no es información
 * suficiente para quien no distingue los tonos.
 */
@Component({
  selector: 'rly-match-score',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <span [class]="ringClasses()" [style]="ringStyle()">
      <span [class]="innerClasses()">{{ value() }}</span>
    </span>

    @if (showLabel()) {
      <span class="text-ui-sm text-text-secondary">
        <span class="font-medium text-ink">{{ tier() }}</span> match
      </span>
    } @else {
      <span class="sr-only">{{ value() }}% de compatibilidad · {{ tier() }}</span>
    }
  `,
})
export class MatchScore {
  /** Porcentaje 0–100. */
  readonly value = input.required<number>();
  readonly size = input<MatchSize>('md');

  /** Muestra la lectura en palabras junto al anillo. */
  readonly showLabel = input(true, { transform: booleanAttribute });

  /** Alto, Bueno o Bajo: la misma escala en toda la aplicación. */
  protected readonly tier = computed(() => {
    const value = this.value();
    if (value >= 85) return 'Alto';
    if (value >= 70) return 'Bueno';
    return 'Bajo';
  });

  private readonly stroke = computed(() => {
    const value = this.value();
    if (value >= 85) return 'var(--rly-color-accent)';
    if (value >= 70) return 'var(--rly-color-ink)';
    return 'var(--rly-color-border-strong)';
  });

  protected readonly ringStyle = computed(
    () =>
      `background: conic-gradient(${this.stroke()} ${this.value() * 3.6}deg, ` +
      `var(--rly-color-surface-muted) 0deg)`,
  );

  protected readonly ringClasses = computed(() =>
    [
      'grid shrink-0 place-items-center rounded-full',
      { sm: 'size-8', md: 'size-10', lg: 'size-14' }[this.size()],
    ].join(' '),
  );

  protected readonly innerClasses = computed(() =>
    [
      'grid place-items-center rounded-full bg-surface font-semibold tabular-nums text-ink',
      {
        sm: 'size-6 text-[0.625rem]',
        md: 'size-8 text-ui-sm',
        lg: 'size-11 text-ui',
      }[this.size()],
    ].join(' '),
  );
}
