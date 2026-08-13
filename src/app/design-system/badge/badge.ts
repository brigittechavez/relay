import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type BadgeTone =
  'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'inverse';
export type BadgeSize = 'sm' | 'md';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-secondary',
  accent: 'bg-accent-soft text-ink',
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-danger-soft text-danger-strong',
  info: 'bg-info-soft text-info-strong',
  inverse: 'bg-inverse-elevated text-text-inverse',
};

const TONE_OUTLINE: Record<BadgeTone, string> = {
  neutral: 'border-border text-text-secondary',
  accent: 'border-accent text-ink',
  success: 'border-success/40 text-success-strong',
  warning: 'border-warning/40 text-warning-strong',
  danger: 'border-danger/40 text-danger-strong',
  info: 'border-info/40 text-info-strong',
  inverse: 'border-border-inverse text-text-inverse',
};

const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-text-muted',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  inverse: 'bg-accent',
};

/**
 * Etiqueta de estado o metadato.
 *
 * El color nunca es la única señal: el texto del badge siempre nombra el
 * estado, y `dot` solo refuerza lo que la etiqueta ya dice.
 */
@Component({
  selector: 'rly-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `
    @if (dot()) {
      <span [class]="dotClasses()" aria-hidden="true"></span>
    }
    <ng-content />
  `,
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
  readonly size = input<BadgeSize>('sm');

  /** Sin relleno: útil sobre superficies ya coloreadas. */
  readonly outline = input(false, { transform: booleanAttribute });

  /** Punto de color a la izquierda, como refuerzo del texto. */
  readonly dot = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    [
      'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
      this.size() === 'sm' ? 'h-6 px-2.5 text-ui-sm' : 'h-7 px-3 text-ui',
      this.outline() ? `border bg-transparent ${TONE_OUTLINE[this.tone()]}` : TONE[this.tone()],
    ].join(' '),
  );

  protected readonly dotClasses = computed(() => `size-1.5 rounded-full ${DOT[this.tone()]}`);
}
