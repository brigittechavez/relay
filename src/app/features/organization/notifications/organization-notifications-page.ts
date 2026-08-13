import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';

import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { NotificationsStore } from '@core/session/notifications.store';
import { NotificationItem } from '@domain/notification-item/notification-item';

/**
 * Notificaciones de la organización.
 *
 * La bandeja depende del contexto activo: al cambiar de organización en el
 * selector cambia también lo que se ve aquí.
 */
@Component({
  selector: 'rly-organization-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, EmptyState, Icon, NotificationItem],
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
              description="Aquí aparecerán las solicitudes nuevas, las conversiones por validar y los avisos de tus campañas."
            />
          </div>
        } @else {
          @for (group of groups(); track group.label) {
            @if (group.items.length) {
              <section class="mt-6" [attr.aria-label]="group.label">
                <h3 class="text-label uppercase text-text-muted">{{ group.label }}</h3>

                <ul
                  class="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border
                         bg-surface"
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
export class OrganizationNotificationsPage {
  protected readonly store = inject(NotificationsStore);

  readonly organizationId = input.required<string>();

  constructor() {
    effect(() => {
      void this.store.load(this.organizationId());
    });
  }

  protected readonly groups = computed(() => {
    const items = this.store.notifications();

    return [
      { label: 'Sin leer', items: items.filter((notification) => !notification.read) },
      { label: 'Anteriores', items: items.filter((notification) => notification.read) },
    ];
  });
}
