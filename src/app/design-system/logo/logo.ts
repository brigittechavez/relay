import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Identidad de RELAY.
 *
 * La marca es un relevo: dos trazos que se pasan el testigo. El logotipo
 * completo la acompaña del wordmark; en espacios estrechos —sidebar plegada,
 * favicon, avatar— se usa solo la marca.
 */
@Component({
  selector: 'rly-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <span [class]="markClasses()" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" class="size-[1.125rem]">
        <path
          d="M4 8.5h6.5a3.5 3.5 0 0 1 0 7H8"
          [attr.stroke]="markStroke()"
          stroke-width="2.4"
          stroke-linecap="round"
        />
        <path
          d="M13.5 12.5 17 16l-3.5 3.5"
          [attr.stroke]="markStroke()"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>

    @if (variant() === 'full') {
      <span [class]="wordClasses()" translate="no">RELAY</span>
    }

    <span class="sr-only">RELAY · inicio</span>
  `,
})
export class Logo {
  readonly variant = input<'full' | 'mark'>('full');

  /** Ajusta el contraste para bloques Ink. */
  readonly onInverse = input(false, { transform: booleanAttribute });

  protected readonly markClasses = computed(() =>
    [
      'flex size-7 items-center justify-center rounded-sm',
      this.onInverse() ? 'bg-accent' : 'bg-ink',
    ].join(' '),
  );

  protected readonly markStroke = computed(() =>
    this.onInverse() ? 'var(--rly-color-ink)' : 'var(--rly-color-accent)',
  );

  protected readonly wordClasses = computed(() =>
    [
      'text-title-xs leading-none tracking-[-0.02em]',
      this.onInverse() ? 'text-text-inverse' : 'text-ink',
    ].join(' '),
  );
}
