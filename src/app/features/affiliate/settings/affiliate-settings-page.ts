import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';
import { DemoControls } from '@core/session/demo-controls';
import { SessionStore } from '@core/session/session.store';
import { DatePipe } from '@shared/pipes/format.pipes';

/**
 * Configuración de la cuenta.
 *
 * Corta a propósito: RELAY no tiene facturación, ni preferencias de correo, ni
 * gestión de dispositivos. Lo que hay aquí es lo que la demo puede sostener de
 * verdad, más los controles del propio modo demo.
 */
@Component({
  selector: 'rly-affiliate-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon, DemoControls, DatePipe],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <div class="mx-auto max-w-2xl">
        <header>
          <h2 class="text-title-md text-ink">Configuración</h2>
          <p class="mt-1 text-ui text-text-secondary">Tu cuenta y los datos de la demo.</p>
        </header>

        @if (session.session(); as current) {
          <section
            class="mt-6 rounded-lg border border-border bg-surface p-5"
            aria-labelledby="cuenta"
          >
            <h3 id="cuenta" class="text-title-xs text-ink">Cuenta</h3>

            <dl class="mt-4 flex flex-col gap-3">
              <div class="flex items-baseline justify-between gap-3">
                <dt class="text-ui-sm text-text-secondary">Nombre</dt>
                <dd class="text-ui text-ink">{{ current.name }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-3">
                <dt class="text-ui-sm text-text-secondary">Correo</dt>
                <dd class="text-ui text-ink">{{ current.email }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-3">
                <dt class="text-ui-sm text-text-secondary">Demo iniciada</dt>
                <dd class="text-ui text-ink">{{ current.startedAt | rlyDate }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-3">
                <dt class="text-ui-sm text-text-secondary">Organizaciones</dt>
                <dd class="text-ui text-ink">{{ current.organizationIds.length }}</dd>
              </div>
            </dl>

            <a
              rlyButton
              variant="tertiary"
              size="sm"
              class="mt-4"
              routerLink="/app/affiliate/perfil"
            >
              Editar mi perfil
              <rly-icon name="arrow-right" [size]="14" />
            </a>
          </section>
        }

        <section class="mt-6" aria-labelledby="demo">
          <h3 id="demo" class="sr-only">Modo demo</h3>
          <rly-demo-controls />
        </section>

        <section
          class="mt-6 rounded-lg border border-border bg-surface p-5"
          aria-labelledby="privacidad"
        >
          <h3 id="privacidad" class="text-title-xs text-ink">Privacidad</h3>
          <p class="mt-2 text-ui text-text-secondary">
            RELAY es un proyecto de portafolio. No hay cuentas reales, no se envía información a
            ningún servidor y no se usa analítica ni seguimiento de terceros. Todo lo que hagas en
            la demo se guarda únicamente en el almacenamiento local de tu navegador.
          </p>
        </section>
      </div>
    </div>
  `,
})
export class AffiliateSettingsPage {
  protected readonly session = inject(SessionStore);
}
