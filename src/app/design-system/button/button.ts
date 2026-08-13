import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ' +
  'font-medium transition-[background-color,border-color,color] duration-micro ease-standard ' +
  'select-none disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none ' +
  'aria-disabled:opacity-45';

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-ui-sm',
  md: 'h-10 px-4 text-ui',
  lg: 'h-12 px-5 text-ui',
};

const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 w-8 px-0',
  md: 'h-10 w-10 px-0',
  lg: 'h-12 w-12 px-0',
};

/** Variantes sobre superficies claras (Canvas / Surface). */
const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-hover',
  secondary: 'bg-ink text-text-inverse hover:bg-inverse-elevated',
  tertiary:
    'bg-surface text-ink border border-border hover:bg-surface-muted hover:border-border-strong',
  ghost: 'text-ink hover:bg-surface-muted',
  danger: 'bg-surface text-danger border border-danger/35 hover:bg-danger-soft',
};

/** Variantes sobre bloques Ink (hero, secciones editoriales, CTA final). */
const VARIANT_INVERSE: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-hover',
  secondary: 'bg-surface text-ink hover:bg-canvas',
  tertiary:
    'bg-transparent text-text-inverse border border-border-inverse hover:bg-inverse-elevated ' +
    'hover:border-text-muted',
  ghost: 'text-text-inverse hover:bg-inverse-elevated',
  danger: 'bg-transparent text-danger border border-danger/45 hover:bg-danger/10',
};

/**
 * Botón de RELAY.
 *
 * Es un componente con selector de atributo, de modo que el elemento sigue
 * siendo un `<button>` o un `<a>` nativo: no se pierden semántica, teclado,
 * `type`, `routerLink` ni `download`.
 *
 * Regla de composición: una vista tiene un único `primary`, uno o dos
 * `secondary` y el resto en `tertiary`/`ghost`.
 */
@Component({
  // El selector apunta a elementos nativos a propósito: el botón NO envuelve un
  // <button>, lo decora. La regla de prefijos asume selectores de elemento propios.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[rlyButton], a[rlyButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.disabled]': 'nativeDisabled()',
    '[attr.aria-disabled]': 'isInactive() ? "true" : null',
    '[attr.tabindex]': 'isInactive() && !isButton ? "-1" : null',
  },
  styles: `
    .rly-button__spinner {
      position: absolute;
      width: 1rem;
      height: 1rem;
      border-radius: 9999px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      animation: rly-button-spin 700ms linear infinite;
    }

    @keyframes rly-button-spin {
      to {
        transform: rotate(1turn);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .rly-button__spinner {
        animation-duration: 2s;
      }
    }
  `,
  template: `
    @if (loading()) {
      <span class="rly-button__spinner"></span>
    }
    <span [class.invisible]="loading()" class="contents">
      <ng-content />
    </span>
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('tertiary');
  readonly size = input<ButtonSize>('md');

  /** Botón cuadrado sin texto visible. Requiere `aria-label` en el elemento. */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  /** Ocupa todo el ancho disponible: habitual en formularios y en móvil. */
  readonly block = input(false, { transform: booleanAttribute });

  /** Ajusta las variantes neutras para superficies Ink. */
  readonly onInverse = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  /** Muestra el indicador de carga y bloquea la interacción. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** `disabled` solo es válido en `<button>`; en `<a>` se usa aria + tabindex. */
  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';

  protected readonly isInactive = computed(() => this.disabled() || this.loading());

  protected readonly nativeDisabled = computed(() =>
    this.isButton && this.isInactive() ? true : null,
  );

  protected readonly classes = computed(() => {
    const variants = this.onInverse() ? VARIANT_INVERSE : VARIANT;
    const sizes = this.iconOnly() ? ICON_ONLY_SIZE : SIZE;

    return [
      BASE,
      this.onInverse() ? 'focus-ring-inverse' : 'focus-ring',
      sizes[this.size()],
      variants[this.variant()],
      this.block() ? 'w-full' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}
