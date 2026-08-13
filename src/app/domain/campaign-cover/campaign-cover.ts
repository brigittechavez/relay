import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { CampaignImage } from '@data/models/campaign';
import { CategoryId } from '@data/models/taxonomy';

export type CoverSize = 'sm' | 'md' | 'lg';

/**
 * Portada de campaña.
 *
 * Cuando la campaña declara imagen definitiva se muestra la imagen; cuando no,
 * se dibuja una composición geométrica derivada del identificador: siempre la
 * misma para la misma campaña, distinta entre campañas y coherente con la
 * paleta. No es un gradiente decorativo ni una imagen de banco.
 *
 * Las dos alternativas ocupan exactamente la misma proporción, así que
 * incorporar las imágenes finales no mueve un solo píxel del layout.
 */
@Component({
  selector: 'rly-campaign-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (image(); as picture) {
      <img
        [src]="picture.src"
        [alt]="picture.alt"
        [attr.loading]="priority() ? null : 'lazy'"
        [attr.fetchpriority]="priority() ? 'high' : null"
        decoding="async"
        class="absolute inset-0 size-full object-cover"
      />
    } @else {
      <svg
        [attr.viewBox]="'0 0 320 180'"
        preserveAspectRatio="xMidYMid slice"
        class="absolute inset-0 size-full"
        aria-hidden="true"
      >
        @switch (pattern()) {
          @case (0) {
            <circle cx="252" cy="42" r="84" [attr.fill]="shapeColor()" opacity="0.9" />
            <circle cx="252" cy="42" r="46" [attr.fill]="baseColor()" />
          }
          @case (1) {
            <path d="M0 180 L136 0 L232 0 L96 180 Z" [attr.fill]="shapeColor()" opacity="0.9" />
            <path
              d="M188 180 L288 46 L320 46 L320 180 Z"
              [attr.fill]="shapeColor()"
              opacity="0.5"
            />
          }
          @case (2) {
            <rect
              x="196"
              y="-20"
              width="164"
              height="164"
              rx="28"
              [attr.fill]="shapeColor()"
              opacity="0.85"
            />
            <rect
              x="24"
              y="112"
              width="104"
              height="104"
              rx="20"
              [attr.fill]="shapeColor()"
              opacity="0.45"
            />
          }
          @default {
            <path
              d="M0 120 C 80 60, 140 160, 220 96 S 300 40, 340 72 L340 200 L0 200 Z"
              [attr.fill]="shapeColor()"
              opacity="0.85"
            />
            <path
              d="M0 150 C 90 100, 150 190, 230 130 S 310 84, 340 110 L340 200 L0 200 Z"
              [attr.fill]="shapeColor()"
              opacity="0.4"
            />
          }
        }
      </svg>
    }

    <span [class]="labelClasses()">{{ label() }}</span>
  `,
})
export class CampaignCover {
  /** Identificador del placeholder. Determina el patrón de forma estable. */
  readonly cover = input.required<string>();
  readonly categoryId = input.required<CategoryId>();

  /** Imagen definitiva. Sin ella se dibuja el placeholder geométrico. */
  readonly image = input<CampaignImage | undefined>(undefined);

  /** Texto corto sobre la portada: iniciales de la organización. */
  readonly label = input('');

  readonly size = input<CoverSize>('md');

  /** Tratamiento oscuro, reservado a las tarjetas destacadas. */
  readonly featured = input(false, { transform: booleanAttribute });

  /**
   * Portada principal de una vista. Se carga de inmediato porque suele ser el
   * elemento que decide el LCP; el resto entra de forma diferida.
   */
  readonly priority = input(false, { transform: booleanAttribute });

  /** Hash estable del identificador → uno de los cuatro patrones. */
  protected readonly pattern = computed(() => {
    const cover = this.cover();
    let hash = 0;
    for (let index = 0; index < cover.length; index++) {
      hash = (hash * 31 + cover.charCodeAt(index)) >>> 0;
    }
    return hash % 4;
  });

  protected readonly baseColor = computed(() =>
    this.featured() ? 'var(--rly-color-inverse)' : 'var(--rly-color-surface-muted)',
  );

  protected readonly shapeColor = computed(() =>
    this.featured() ? 'var(--rly-color-accent)' : 'var(--rly-color-border)',
  );

  protected readonly hostClasses = computed(() =>
    [
      'relative block overflow-hidden',
      this.featured() ? 'bg-inverse' : 'bg-surface-muted',
      { sm: 'aspect-[16/9]', md: 'aspect-[16/9]', lg: 'aspect-[21/9]' }[this.size()],
    ].join(' '),
  );

  protected readonly labelClasses = computed(() =>
    [
      'absolute bottom-3 left-3 flex items-center rounded-xs px-2 py-1 text-label',
      'uppercase tracking-wider',
      this.featured() ? 'bg-ink/70 text-text-inverse' : 'bg-surface/80 text-text-secondary',
      this.label() ? '' : 'hidden',
    ].join(' '),
  );
}
