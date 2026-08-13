import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';
import { Modal } from '@ds/modal/modal';
import { ToastService } from '@ds/toast/toast.service';
import { NotificationsStore } from './notifications.store';
import { SavedStore } from './saved.store';
import { SessionStore } from './session.store';

/**
 * Controles de la demo: aviso de modo demo y restablecimiento.
 *
 * Restablecer devuelve todo al seed original —campañas, solicitudes, links,
 * conversiones y guardados— y termina la sesión. Es una acción destructiva
 * sobre el trabajo hecho durante la visita, así que pide confirmación y
 * enumera qué se pierde.
 */
@Component({
  selector: 'rly-demo-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, Modal],
  host: { class: 'block' },
  template: `
    <div class="rounded-lg border border-border bg-surface-muted p-4">
      <p class="flex items-center gap-2 text-ui font-medium text-ink">
        <span class="size-1.5 rounded-full bg-accent" aria-hidden="true"></span>
        Modo demo
      </p>
      <p class="mt-1.5 text-ui-sm text-text-secondary">
        Los datos viven en tu navegador. Nada se envía a ningún servidor y no hay pagos reales.
      </p>

      <button
        rlyButton
        variant="tertiary"
        size="sm"
        type="button"
        class="mt-3"
        (click)="confirmOpen.set(true)"
      >
        <rly-icon name="reset" [size]="14" />
        Restablecer datos
      </button>
    </div>

    <rly-modal
      [open]="confirmOpen()"
      title="Restablecer la demo"
      description="Esta acción no se puede deshacer."
      size="sm"
      (closed)="confirmOpen.set(false)"
    >
      <p class="text-ui text-text-secondary">
        Se descartará todo lo que hayas hecho en esta visita:
      </p>

      <ul class="mt-3 flex flex-col gap-1.5">
        @for (item of discarded; track item) {
          <li class="flex items-start gap-2 text-ui text-text-secondary">
            <rly-icon name="close" [size]="14" class="mt-1 text-text-muted" />
            <span>{{ item }}</span>
          </li>
        }
      </ul>

      <p class="mt-4 text-ui-sm text-text-muted">
        Volverás a la portada y los datos quedarán como al empezar.
      </p>

      <button modalFooter rlyButton variant="ghost" (click)="confirmOpen.set(false)">
        Cancelar
      </button>
      <button modalFooter rlyButton variant="danger" [loading]="busy()" (click)="reset()">
        Restablecer
      </button>
    </rly-modal>
  `,
})
export class DemoControls {
  private readonly session = inject(SessionStore);
  private readonly saved = inject(SavedStore);
  private readonly notifications = inject(NotificationsStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly confirmOpen = signal(false);
  protected readonly busy = signal(false);

  protected readonly discarded = [
    'Solicitudes enviadas y decisiones tomadas',
    'Links y códigos creados',
    'Campañas publicadas durante la demo',
    'Campañas guardadas y comparaciones',
    'Cambios en tu perfil y en tus organizaciones',
  ];

  protected async reset(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);

    try {
      await this.session.resetDemo();
      this.saved.invalidate();
      this.notifications.clear();
      this.confirmOpen.set(false);

      await this.router.navigateByUrl('/');
      this.toasts.success('Demo restablecida');
    } catch {
      this.toasts.error('No se pudo restablecer la demo');
    } finally {
      this.busy.set(false);
    }
  }
}
