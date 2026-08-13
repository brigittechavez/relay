import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonShape = 'text' | 'block' | 'circle';

/**
 * Marcador de carga.
 *
 * Se dimensiona siempre con el tamaño real del contenido que sustituye: el
 * objetivo del skeleton en RELAY es reservar el espacio y evitar saltos de
 * layout, no decorar la espera.
 */
@Component({
  selector: 'rly-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[style.width]': 'width()',
    '[style.height]': 'resolvedHeight()',
    'aria-hidden': 'true',
  },
  styles: `
    :host {
      background-image: linear-gradient(
        90deg,
        var(--rly-color-surface-muted) 0%,
        color-mix(in srgb, var(--rly-color-surface-muted) 55%, var(--rly-color-surface)) 50%,
        var(--rly-color-surface-muted) 100%
      );
      background-size: 200% 100%;
      animation: rly-skeleton-shimmer 1.4s var(--rly-ease-standard) infinite;
    }

    @keyframes rly-skeleton-shimmer {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -200% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
        background-image: none;
        background-color: var(--rly-color-surface-muted);
      }
    }
  `,
  template: '',
})
export class Skeleton {
  readonly shape = input<SkeletonShape>('text');

  /** Cualquier medida CSS. Por defecto ocupa el ancho disponible. */
  readonly width = input('100%');

  /** Alto explícito. En `text` se deriva de la escala tipográfica. */
  readonly height = input<string | null>(null);

  protected readonly resolvedHeight = computed(
    () => this.height() ?? (this.shape() === 'text' ? '0.875rem' : '100%'),
  );

  protected readonly classes = computed(() =>
    [
      'block',
      this.shape() === 'circle' ? 'rounded-full' : '',
      this.shape() === 'text' ? 'rounded-xs' : '',
      this.shape() === 'block' ? 'rounded-md' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
