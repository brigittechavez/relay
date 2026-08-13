import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { NotificationsStore } from '@core/session/notifications.store';
import { NotificationItem } from '@domain/notification-item/notification-item';

/**
 * Centro de notificaciones del afiliado.
 *
 * Agrupa por antigüedad porque lo reciente es lo accionable: una aprobación de
 * hoy exige respuesta, una de hace tres semanas es historial.
 */
@Component({
  selector: 'rly-affiliate-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, EmptyState, Icon, NotificationItem],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <div class="mx-auto max-w-3xl">
        <header class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 class="text-title-md text-ink">Notificaciones</h2>
            <p class="mt-1 text-ui text-text-secondary">
              @if (store.unreadCount()) {
                Tienes {{ store.unreadCount() }} sin leer.
              } @else {
                Todo al día.
              }
            </p>
          </div>

          @if (store.unreadCount()) {
            <button rlyButton variant="tertiary" type="button" (click)="store.markAllRead()">
              <rly-icon name="check" [size]="16" />
              Marcar todas como leídas
            </button>
          }
        </header>

        @if (!store.notifications().length) {
          <div class="mt-6 rounded-lg border border-border bg-surface">
            <rly-empty-state
              icon="bell"
              title="No tienes notificaciones"
              description="Aquí aparecerán las respuestas a tus solicitudes, las comisiones aprobadas y los avisos de tus campañas."
            >
              <a rlyButton variant="primary" routerLink="/app/affiliate/marketplace">
                Explorar campañas
              </a>
            </rly-empty-state>
          </div>
        } @else {
          @for (group of groups(); track group.label) {
            @if (group.items.length) {
              <section class="mt-6" [attr.aria-label]="group.label">
                <h3 class="text-label uppercase text-text-muted">{{ group.label }}</h3>

                <ul
                  class="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border bg-surface"
                >
                  @for (notification of group.items; track notification.id) {
                    <li>
                      <rly-notification-item
                        [notification]="notification"
                        (opened)="store.markRead(notification.id)"
                      />
                    </li>
                  }
                </ul>
              </section>
            }
          }
        }
      </div>
    </div>
  `,
})
export class AffiliateNotificationsPage {
  protected readonly store = inject(NotificationsStore);

  constructor() {
    effect(() => {
      void this.store.load('affiliate');
    });
  }

  protected readonly groups = computed(() => {
    const items = this.store.notifications();
    const unread = items.filter((notification) => !notification.read);
    const read = items.filter((notification) => notification.read);

    return [
      { label: 'Sin leer', items: unread },
      { label: 'Anteriores', items: read },
    ];
  });
}
