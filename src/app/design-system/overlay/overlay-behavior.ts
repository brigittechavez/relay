import { DOCUMENT, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Comportamiento compartido por modal y drawer: bloqueo de scroll del documento
 * y devolución del foco al elemento que abrió el overlay.
 *
 * Se implementa como servicio para que ambos componentes tengan exactamente el
 * mismo contrato, y no como duplicado en cada uno. Todo el acceso al DOM está
 * detrás de `isBrowser`, de modo que el render en servidor no lo ejecuta.
 */
@Injectable()
export class OverlayBehavior {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private previouslyFocused: HTMLElement | null = null;
  private scrollLockCount = 0;

  readonly open = signal(false);

  constructor() {
    effect(() => (this.open() ? this.activate() : this.deactivate()));
  }

  private activate(): void {
    if (!this.isBrowser || this.scrollLockCount > 0) return;

    this.previouslyFocused = this.document.activeElement as HTMLElement | null;

    const body = this.document.body;
    // Compensar la barra de scroll evita que el contenido salte al bloquearla.
    const scrollbar = window.innerWidth - this.document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) {
      body.style.paddingRight = `${scrollbar}px`;
    }

    this.scrollLockCount = 1;
  }

  private deactivate(): void {
    if (!this.isBrowser || this.scrollLockCount === 0) return;

    const body = this.document.body;
    body.style.removeProperty('overflow');
    body.style.removeProperty('padding-right');
    this.scrollLockCount = 0;

    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }
}
