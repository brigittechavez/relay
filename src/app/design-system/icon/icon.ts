import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ICON_REGISTRY, IconName } from './icon-registry.generated';

/**
 * Icono de línea del sistema. El SVG se compone a partir del registro
 * generado, de modo que no hay peticiones de red ni librería en runtime.
 *
 * Por defecto el icono es decorativo (`aria-hidden`): acompaña a un texto que
 * ya comunica el significado. Cuando el icono es el único contenido de un
 * control —un botón de solo icono, por ejemplo— hay que pasarle `label`.
 */
@Component({
  selector: 'rly-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'inline-flex shrink-0 items-center justify-center',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[innerHTML]': 'svg()',
  },
  template: '',
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>();

  /** Lado del icono en píxeles. La rejilla del set es de 24. */
  readonly size = input(20);

  /**
   * Grosor de trazo. 1.75 es el valor de la interfaz; 2.25 se reserva para
   * señalar el elemento activo de navegación sin cambiar de familia de iconos.
   */
  readonly strokeWidth = input(1.75);

  /** Texto alternativo. Presente solo cuando el icono no acompaña a un texto. */
  readonly label = input<string>('');

  protected readonly svg = computed<SafeHtml>(() => {
    const body = ICON_REGISTRY[this.name()];

    // El contenido procede del registro generado en build, nunca de datos de
    // usuario, por lo que marcarlo como confiable no abre superficie de XSS.
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" ` +
        `fill="none" stroke="currentColor" stroke-width="${this.strokeWidth()}" ` +
        `stroke-linecap="round" stroke-linejoin="round" focusable="false">${body}</svg>`,
    );
  });
}
