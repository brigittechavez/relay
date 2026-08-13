import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type CardSurface = 'surface' | 'muted' | 'inverse' | 'accent';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const SURFACE: Record<CardSurface, string> = {
  surface: 'bg-surface border-border',
  muted: 'bg-surface-muted border-border',
  inverse: 'bg-inverse-elevated border-border-inverse text-text-inverse',
  accent: 'bg-accent-soft border-accent/50',
};

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-7',
};

/**
 * Superficie base del sistema.
 *
 * Las tarjetas de RELAY se separan del fondo con un borde, no con sombra: la
 * elevación queda reservada a overlays. `interactive` añade la respuesta de
 * hover para las tarjetas que son enlaces, sin convertir la tarjeta en el
 * elemento interactivo (eso lo decide quien la usa).
 */
@Component({
  selector: 'rly-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: '<ng-content />',
})
export class Card {
  readonly surface = input<CardSurface>('surface');
  readonly padding = input<CardPadding>('md');

  /** Respuesta visual al hover, para tarjetas que envuelven un enlace. */
  readonly interactive = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    [
      'block rounded-lg border',
      SURFACE[this.surface()],
      PADDING[this.padding()],
      this.interactive()
        ? 'transition-[border-color,box-shadow,transform] duration-ui ease-standard ' +
          'hover:border-border-strong hover:shadow-sm focus-within:border-border-strong'
        : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
