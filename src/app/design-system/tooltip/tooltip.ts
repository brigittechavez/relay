import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'rly-tooltip-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tooltip',
    class: 'block max-w-64 rounded-sm bg-ink px-2.5 py-1.5 text-ui-sm text-text-inverse shadow-md',
  },
  template: '{{ text() }}',
})
export class TooltipPanel {
  readonly text = signal('');
}

/**
 * Tooltip accesible.
 *
 * Aparece con hover **y** con foco de teclado, y el disparador queda enlazado
 * con `aria-describedby`, de modo que el contenido se anuncia en lugar de
 * quedar solo a la vista. Escape lo cierra.
 *
 * Un tooltip nunca es el único portador de una información necesaria: en RELAY
 * amplía un dato que ya está en pantalla.
 */
@Directive({
  selector: '[rlyTooltip]',
  host: {
    '(mouseenter)': 'open()',
    '(mouseleave)': 'close()',
    '(focus)': 'open()',
    '(blur)': 'close()',
    '(keydown.escape)': 'close()',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class Tooltip implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private static sequence = 0;

  private readonly id = `rly-tooltip-${++Tooltip.sequence}`;
  private overlayRef: OverlayRef | null = null;

  readonly rlyTooltip = input.required<string>();

  protected readonly describedBy = signal<string | null>(null);

  protected open(): void {
    if (!this.isBrowser || this.overlayRef || !this.rlyTooltip()) return;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions([
          {
            originX: 'center',
            originY: 'top',
            overlayX: 'center',
            overlayY: 'bottom',
            offsetY: -8,
          },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    const panel = this.overlayRef.attach(new ComponentPortal(TooltipPanel));
    panel.instance.text.set(this.rlyTooltip());
    panel.location.nativeElement.id = this.id;
    this.describedBy.set(this.id);
  }

  protected close(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.describedBy.set(null);
  }

  ngOnDestroy(): void {
    this.close();
  }
}
