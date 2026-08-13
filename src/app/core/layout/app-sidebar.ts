import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Icon } from '@ds/icon/icon';
import { Tooltip } from '@ds/tooltip/tooltip';
import { NavItem } from '../navigation/navigation';

/**
 * Barra lateral de la aplicación.
 *
 * Plegada muestra solo iconos con tooltip; desplegada, icono y etiqueta. El
 * destino activo se marca con una barra Relay Acid a la izquierda además del
 * cambio de color, para no depender únicamente del contraste.
 */
@Component({
  selector: 'rly-app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon, Tooltip],
  host: { class: 'flex h-full flex-col gap-1' },
  template: `
    <nav [attr.aria-label]="ariaLabel()" class="flex-1">
      <ul class="flex flex-col gap-0.5">
        @for (item of items(); track item.link) {
          <li>
            <a
              [routerLink]="item.link"
              routerLinkActive
              #active="routerLinkActive"
              [routerLinkActiveOptions]="{ exact: !!item.exact }"
              [attr.aria-current]="active.isActive ? 'page' : null"
              [rlyTooltip]="collapsed() ? item.label : ''"
              [class]="linkClasses(active.isActive)"
            >
              <span [class]="indicatorClasses(active.isActive)" aria-hidden="true"></span>

              <rly-icon
                [name]="item.icon"
                [size]="18"
                [strokeWidth]="active.isActive ? 2.25 : 1.75"
              />

              @if (!collapsed()) {
                <span class="truncate">{{ item.label }}</span>
              }
            </a>
          </li>
        }
      </ul>
    </nav>

    @if (secondaryItems().length) {
      <div class="border-t border-border pt-2">
        <ul class="flex flex-col gap-0.5">
          @for (item of secondaryItems(); track item.link) {
            <li>
              <a
                [routerLink]="item.link"
                routerLinkActive
                #active="routerLinkActive"
                [attr.aria-current]="active.isActive ? 'page' : null"
                [rlyTooltip]="collapsed() ? item.label : ''"
                [class]="linkClasses(active.isActive)"
              >
                <span [class]="indicatorClasses(active.isActive)" aria-hidden="true"></span>
                <rly-icon [name]="item.icon" [size]="18" />
                @if (!collapsed()) {
                  <span class="truncate">{{ item.label }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class AppSidebar {
  readonly items = input.required<readonly NavItem[]>();
  readonly secondaryItems = input<readonly NavItem[]>([]);
  readonly collapsed = input(false);
  readonly ariaLabel = input('Navegación del área de trabajo');

  protected linkClasses(isActive: boolean): string {
    const base =
      'focus-ring relative flex h-10 items-center gap-3 rounded-sm pr-3 text-ui ' +
      'transition-colors duration-micro ease-standard';

    const layout = this.collapsed() ? 'justify-center pl-3' : 'pl-3';

    return `${base} ${layout} ${
      isActive ? 'bg-surface-muted font-medium text-ink' : 'text-text-secondary hover:text-ink'
    }`;
  }

  protected indicatorClasses(isActive: boolean): string {
    return [
      'absolute left-0 h-5 w-0.5 rounded-r-full transition-colors duration-micro',
      isActive ? 'bg-accent' : 'bg-transparent',
    ].join(' ');
  }
}
