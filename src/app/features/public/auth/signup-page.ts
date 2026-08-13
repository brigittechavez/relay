import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { InputField } from '@ds/input/input';
import { Logo } from '@ds/logo/logo';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { SavedStore } from '@core/session/saved.store';

/**
 * Registro simulado.
 *
 * Crea un perfil vacío en el estado local de la demo y lleva al onboarding.
 * No hay verificación de correo, contraseña ni cuenta en ningún servidor: la
 * página lo declara igual que la de acceso.
 */
@Component({
  selector: 'rly-signup-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, Button, Field, Icon, InputField, Logo],
  host: { class: 'block' },
  template: `
    <div class="container-page py-12 lg:py-16">
      <div class="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="valor">
          <rly-logo />

          <h1 id="valor" class="mt-8 text-title-lg text-ink">Crea tu cuenta demo</h1>
          <p class="mt-3 max-w-md text-body-lg text-text-secondary">
            Empiezas con un perfil vacío y el onboarding lo completa en tres pasos. Después
            decides si operas como afiliado, como organización o como ambos.
          </p>

          <ul class="mt-8 flex flex-col gap-3">
            @for (item of highlights; track item) {
              <li class="flex items-start gap-2.5 text-ui text-text-secondary">
                <rly-icon name="check" [size]="16" class="mt-1 text-ink" />
                <span>{{ item }}</span>
              </li>
            }
          </ul>

          <p
            class="mt-8 flex items-start gap-2.5 rounded-md border border-border bg-surface-muted
                   px-4 py-3 text-ui-sm text-text-secondary"
          >
            <rly-icon name="info" [size]="16" class="mt-0.5 text-info" />
            <span>
              El registro es simulado: no se crea ninguna cuenta real ni se envía correo alguno.
              Todo se guarda en tu navegador.
            </span>
          </p>
        </section>

        <section
          class="rounded-lg border border-border bg-surface p-6 sm:p-8"
          aria-labelledby="formulario"
        >
          <h2 id="formulario" class="text-title-xs text-ink">Datos de la cuenta</h2>

          <form #form class="mt-6 flex flex-col gap-5" (keydown.enter)="submit()">
            <rly-field label="Nombre" required [error]="nameError()">
              <input
                rlyInput
                type="text"
                name="name"
                autocomplete="name"
                placeholder="Tu nombre"
                [ngModel]="name()"
                (ngModelChange)="name.set($event)"
              />
            </rly-field>

            <rly-field label="Correo electrónico" required [error]="emailError()">
              <input
                rlyInput
                type="email"
                name="email"
                autocomplete="email"
                placeholder="tucorreo@ejemplo.com"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
              />
            </rly-field>

            <rly-field label="Contraseña" hint="No se comprueba ni se guarda">
              <input
                rlyInput
                type="password"
                name="password"
                autocomplete="new-password"
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
              Crear cuenta y continuar
            </button>
          </form>

          <p class="mt-6 border-t border-border pt-6 text-ui text-text-secondary">
            ¿Prefieres entrar con datos ya cargados?
            <a
              routerLink="/login"
              class="focus-ring rounded-xs font-medium text-ink underline-offset-4 hover:underline"
            >
              Ver la demo directamente
            </a>
          </p>
        </section>
      </div>
    </div>
  `,
})
export class SignupPage {
  private readonly form = viewChild.required<ElementRef<HTMLFormElement>>('form');

  private readonly session = inject(SessionStore);
  private readonly saved = inject(SavedStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly highlights = [
    'Acceso completo al marketplace y a todas las campañas',
    'Solicitudes, links, códigos y seguimiento de comisiones',
    'Puedes crear una organización y publicar tu propia campaña',
    'Restablecer la demo devuelve todo a su estado original',
  ];

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);

  constructor() {
    /**
     * Recupera lo que se haya escrito antes de la hidratación.
     *
     * La página se sirve prerenderizada, así que se puede empezar a escribir
     * antes de que Angular se enganche a los campos. Ese texto queda en el DOM
     * pero no llega a las señales, y al enviar el formulario parecería vacío.
     */
    afterNextRender(() => {
      const controls = this.form().nativeElement.elements;
      this.name.set(value(controls, 'name') || this.name());
      this.email.set(value(controls, 'email') || this.email());
      this.password.set(value(controls, 'password') || this.password());
    });
  }

  protected readonly nameError = computed(() =>
    this.submitted() && !this.name().trim() ? 'Escribe tu nombre para continuar' : null,
  );

  protected readonly emailError = computed(() => {
    if (!this.submitted()) return null;

    const email = this.email().trim();
    if (!email) return 'Introduce un correo electrónico';
    if (!email.includes('@')) return 'Introduce un correo con formato válido';

    return null;
  });

  protected async submit(): Promise<void> {
    this.submitted.set(true);

    if (this.nameError() || this.emailError() || this.busy()) return;

    this.busy.set(true);

    try {
      await this.session.start('new', this.name().trim(), this.email().trim());
      this.saved.invalidate();
      await this.saved.load();
      await this.router.navigateByUrl('/onboarding');
    } catch {
      this.toasts.error('No se pudo crear la cuenta demo');
    } finally {
      this.busy.set(false);
    }
  }
}

/** Valor actual de un campo del formulario, tal y como está en el DOM. */
function value(controls: HTMLFormControlsCollection, name: string): string {
  const control = controls.namedItem(name);
  return control instanceof HTMLInputElement ? control.value.trim() : '';
}
