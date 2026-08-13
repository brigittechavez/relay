import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '@ds/icon/icon';
import { Notification, NOTIFICATION_ICONS } from '@data/models/notification';
import { RelativeDatePipe } from '@shared/pipes/format.pipes';

/**
 * Entrada del centro de notificaciones.
 *
 * Lo no leído se marca con un punto y con peso tipográfico, no solo con color
 * de fondo, para que la distinción sobreviva a cualquier ajuste de contraste
 * del sistema.
 */
@Component({
  selector: 'rly-notification-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, RelativeDatePipe],
  host: { class: 'block' },
  template: `
    <a [routerLink]="notification().link ?? null" [class]="classes()" (click)="opened.emit()">
      <span [class]="iconClasses()" aria-hidden="true">
        <rly-icon [name]="icon()" [size]="16" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-start gap-2">
          <span class="min-w-0 flex-1 text-ui" [class.font-medium]="!notification().read">
            {{ notification().title }}
          </span>

          @if (!notification().read) {
            <span class="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden="true"></span>
            <span class="sr-only">Sin leer</span>
          }
        </span>

        <span class="mt-0.5 block text-ui-sm text-text-secondary">{{ notification().body }}</span>
        <span class="mt-1 block text-ui-sm text-text-muted">
          {{ notification().createdAt | rlyRelativeDate }}
        </span>
      </span>
    </a>
  `,
})
export class NotificationItem {
  readonly notification = input.required<Notification>();

  readonly opened = output<void>();

  protected readonly icon = computed(() => NOTIFICATION_ICONS[this.notification().kind]);

  protected readonly classes = computed(() =>
    [
      'focus-ring flex gap-3 rounded-md p-3 transition-colors duration-micro',
      this.notification().link ? 'hover:bg-surface-muted' : 'cursor-default',
      this.notification().read ? 'text-text-secondary' : 'text-ink',
    ].join(' '),
  );

  protected readonly iconClasses = computed(() =>
    [
      'grid size-8 shrink-0 place-items-center rounded-sm',
      this.notification().read ? 'bg-surface-muted text-text-secondary' : 'bg-ink text-accent',
    ].join(' '),
  );
}
