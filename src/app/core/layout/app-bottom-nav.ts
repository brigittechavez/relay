import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Icon } from '@ds/icon/icon';
import { NavItem } from '../navigation/navigation';

/**
 * Navegación inferior en móvil.
 *
 * Cuatro destinos frecuentes más «Más», que abre el resto del área. La barra
 * respeta el área segura del dispositivo y marca el destino activo con color y
 * con una barra Relay Acid superior.
 */
@Component({
  selector: 'rly-app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  host: {
    class:
      'fixed inset-x-0 bottom-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden',
    style: 'z-index: var(--rly-z-sticky)',
  },
  template: `
    <nav aria-label="Navegación principal">
      <ul class="grid grid-cols-5">
        @for (item of items(); track item.link) {
          <li>
            <a
              [routerLink]="item.link"
              routerLinkActive
              #active="routerLinkActive"
              [attr.aria-current]="active.isActive ? 'page' : null"
              [class]="itemClasses(active.isActive)"
            >
              <span [class]="indicatorClasses(active.isActive)" aria-hidden="true"></span>
              <rly-icon
                [name]="item.icon"
                [size]="20"
                [strokeWidth]="active.isActive ? 2.25 : 1.75"
              />
              <span class="text-[0.6875rem] leading-none">{{ item.label }}</span>
            </a>
          </li>
        }

        <li>
          <button type="button" [class]="itemClasses(false)" (click)="moreRequested.emit()">
            <span [class]="indicatorClasses(false)" aria-hidden="true"></span>
            <rly-icon name="more" [size]="20" />
            <span class="text-[0.6875rem] leading-none">Más</span>
          </button>
        </li>
      </ul>
    </nav>
  `,
})
export class AppBottomNav {
  readonly items = input.required<readonly NavItem[]>();

  readonly moreRequested = output<void>();

  protected itemClasses(isActive: boolean): string {
    return [
      'focus-ring relative flex h-bottom-nav w-full flex-col items-center justify-center gap-1',
      'transition-colors duration-micro',
      isActive ? 'font-medium text-ink' : 'text-text-secondary',
    ].join(' ');
  }

  protected indicatorClasses(isActive: boolean): string {
    return [
      'absolute inset-x-4 top-0 h-0.5 rounded-b-full transition-colors duration-micro',
      isActive ? 'bg-accent' : 'bg-transparent',
    ].join(' ');
  }
}
