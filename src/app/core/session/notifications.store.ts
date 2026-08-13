import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Notification } from '@data/models/notification';
import { EngagementRepository } from '@data/repositories/engagement.repository';

/**
 * Centro de notificaciones.
 *
 * La audiencia es `affiliate` o el identificador de la organización: al
 * cambiar de contexto en el workspace switcher cambia también la bandeja, que
 * es lo que espera quien administra varias organizaciones.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly repository = inject(EngagementRepository);

  private readonly items = signal<readonly Notification[]>([]);
  private readonly audience = signal<string | null>(null);

  readonly notifications = this.items.asReadonly();

  readonly unreadCount = computed(
    () => this.items().filter((notification) => !notification.read).length,
  );

  async load(audience: string): Promise<void> {
    this.audience.set(audience);
    this.items.set(await firstValueFrom(this.repository.listNotifications(audience)));
  }

  async markRead(id: string): Promise<void> {
    const target = this.items().find((notification) => notification.id === id);
    if (!target || target.read) return;

    this.items.update((items) =>
      items.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );

    await firstValueFrom(this.repository.markNotificationRead(id));
  }

  async markAllRead(): Promise<void> {
    const audience = this.audience();
    if (!audience) return;

    this.items.update((items) => items.map((notification) => ({ ...notification, read: true })));
    await firstValueFrom(this.repository.markAllNotificationsRead(audience));
  }

  clear(): void {
    this.items.set([]);
    this.audience.set(null);
  }
}
