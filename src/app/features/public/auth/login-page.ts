import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { InputField } from '@ds/input/input';
import { Logo } from '@ds/logo/logo';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { SavedStore } from '@core/session/saved.store';

/**
 * Acceso a la demo.
 *
 * No hay autenticación: no se validan credenciales, no hay tokens y no viaja
 * nada a ningún servidor. La página lo dice explícitamente en lugar de simular
 * un inicio de sesión creíble, que sería engañoso en un proyecto público.
 *
 * Los dos accesos directos son el camino principal; el formulario existe
 * porque un producto de este tipo lo tendría y porque permite enseñar el
 * tratamiento de formularios del sistema.
 */
@Component({
  selector: 'rly-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, Button, Field, Icon, InputField, Logo],
  host: { class: 'block' },
  template: `
    <div class="container-page py-12 lg:py-16">
      <div class="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-16">
        <!-- Accesos demo -->
        <section aria-labelledby="demo">
          <rly-logo />

          <h1 id="demo" class="mt-8 text-title-lg text-ink">Entra en la demo de RELAY</h1>
          <p class="mt-3 max-w-md text-body-lg text-text-secondary">
            Dos puntos de partida con datos ya cargados. Puedes cambiar de contexto en cualquier
            momento desde el selector de la aplicación.
          </p>

          <div class="mt-8 flex flex-col gap-3">
            <button
              type="button"
              class="focus-ring group flex items-start gap-4 rounded-lg border border-border
                     bg-surface p-5 text-left transition-[border-color,box-shadow] duration-ui
                     hover:border-border-strong hover:shadow-sm"
              [disabled]="busy()"
              (click)="enterAs('affiliate')"
            >
              <span
                class="grid size-10 shrink-0 place-items-center rounded-sm bg-accent
                       text-accent-contrast"
                aria-hidden="true"
              >
                <rly-icon name="profile" [size]="20" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="block text-title-xs text-ink">Ver demo como afiliado</span>
                <span class="mt-1 block text-ui text-text-secondary">
                  Entras como Lucía Vega, nivel Pro con tres campañas activas y una solicitud en
                  revisión.
                </span>
              </span>

              <rly-icon
                name="arrow-right"
                [size]="18"
                class="mt-1 text-text-muted transition-transform duration-micro
                       group-hover:translate-x-0.5"
              />
            </button>

            <button
              type="button"
              class="focus-ring group flex items-start gap-4 rounded-lg border border-border
                     bg-surface p-5 text-left transition-[border-color,box-shadow] duration-ui
                     hover:border-border-strong hover:shadow-sm"
              [disabled]="busy()"
              (click)="enterAs('organization')"
            >
              <span
                class="grid size-10 shrink-0 place-items-center rounded-sm bg-ink text-accent"
                aria-hidden="true"
              >
                <rly-icon name="organization" [size]="20" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="block text-title-xs text-ink">Ver demo como empresa</span>
                <span class="mt-1 block text-ui text-text-secondary">
                  Entras como Norte Digital, con tres solicitudes esperando revisión y dos
                  conversiones por validar.
                </span>
              </span>

              <rly-icon
                name="arrow-right"
                [size]="18"
                class="mt-1 text-text-muted transition-transform duration-micro
                       group-hover:translate-x-0.5"
              />
            </button>
          </div>

          <p class="mt-6 text-ui-sm text-text-muted">
            RELAY está en modo demo: entras sin credenciales y todo queda en tu navegador.
          </p>
        </section>

        <!-- Formulario -->
        <section
          class="rounded-lg border border-border bg-surface p-6 sm:p-8"
          aria-labelledby="formulario"
        >
          <h2 id="formulario" class="text-title-xs text-ink">Iniciar sesión</h2>
          <p class="mt-1 text-ui-sm text-text-secondary">
            Cualquier dato sirve: abre la misma demo de afiliado.
          </p>

          <form class="mt-6 flex flex-col gap-5" (keydown.enter)="submit()">
            <rly-field label="Correo electrónico" [error]="emailError()">
              <input
                rlyInput
                type="email"
                name="email"
                autocomplete="email"
                placeholder="lucia@relay.demo"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
              />
            </rly-field>

            <rly-field label="Contraseña" hint="No se comprueba ni se guarda">
              <input
                rlyInput
                type="password"
                name="password"
                autocomplete="current-password"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
              />
            </rly-field>

            <button
              rlyButton
              variant="primary"
              block
              type="button"
              [loading]="busy()"
              (click)="submit()"
            >
              Entrar en la demo
            </button>
          </form>

          <p class="mt-6 border-t border-border pt-6 text-ui text-text-secondary">
            ¿No tienes cuenta?
            <a
              routerLink="/registro"
              class="focus-ring rounded-xs font-medium text-ink underline-offset-4 hover:underline"
            >
              Crear una cuenta demo
            </a>
          </p>
        </section>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionStore);
  private readonly saved = inject(SavedStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly emailError = signal<string | null>(null);

  protected submit(): void {
    const email = this.email().trim();

    if (email && !email.includes('@')) {
      this.emailError.set('Introduce un correo con formato válido');
      return;
    }

    this.emailError.set(null);
    void this.enterAs('affiliate');
  }

  protected async enterAs(as: 'affiliate' | 'organization'): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);

    try {
      const session = await this.session.start(as);
      this.saved.invalidate();
      await this.saved.load();

      // Si se llegó aquí desde una ruta protegida, se retoma ese destino.
      const intended = this.route.snapshot.queryParamMap.get('destino');
      const fallback =
        as === 'affiliate'
          ? '/app/affiliate/inicio'
          : `/app/organization/${session.organizationIds[0]}/overview`;

      await this.router.navigateByUrl(intended ?? fallback);
    } catch {
      this.toasts.error('No se pudo iniciar la demo');
    } finally {
      this.busy.set(false);
    }
  }
}
