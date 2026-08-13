import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';
import { IconName } from '@ds/icon/icon-registry.generated';

interface Step {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
}

const AFFILIATE_STEPS: readonly Step[] = [
  {
    icon: 'marketplace',
    title: 'Descubre',
    body:
      'Filtra el marketplace por categoría, comisión, canal y modalidad de acceso. Cada campaña ' +
      'muestra qué conversión paga y en qué condiciones antes de que entres a leerla.',
  },
  {
    icon: 'check-circle',
    title: 'Comprueba y aplica',
    body:
      'Con tu perfil activo ves tu compatibilidad y la lista de requisitos: cuáles cumples, ' +
      'cuáles no y qué te falta exactamente. Aplicas sabiendo a qué atenerte.',
  },
  {
    icon: 'link',
    title: 'Promociona',
    body:
      'Al ser aprobado generas tantos links como canales uses, cada uno con su nombre, y tu ' +
      'código promocional si la campaña lo permite. Los recursos de la marca están ahí mismo.',
  },
  {
    icon: 'earnings',
    title: 'Cobra',
    body:
      'Cada conversión pasa por validación, aprobación y programación de pago. Ves en qué punto ' +
      'está cada una y cuánto tienes pendiente, disponible y ya cobrado.',
  },
];

const ORGANIZATION_STEPS: readonly Step[] = [
  {
    icon: 'plus',
    title: 'Crea la campaña',
    body:
      'Cuatro pasos: qué ofreces, cuánto pagas y por qué conversión, a quién aceptas y con qué ' +
      'materiales. Los campos que no aplican a tu modalidad no se muestran.',
  },
  {
    icon: 'applications',
    title: 'Elige con quién trabajas',
    body:
      'Abierta para captar volumen, selectiva para revisar cada solicitud o premium cuando ' +
      'necesitas un perfil concreto. Revisas con el match y los requisitos delante.',
  },
  {
    icon: 'affiliates',
    title: 'Activa afiliados',
    body:
      'Al aprobar, la persona recibe su link y su código al instante. Puedes pausar o finalizar ' +
      'una colaboración conservando el historial.',
  },
  {
    icon: 'analytics',
    title: 'Mide y paga',
    body:
      'Conversiones, revenue atribuido, comisiones pendientes y rendimiento por afiliado y por ' +
      'canal. Validas cada conversión y programas el pago.',
  },
];

/**
 * Cómo funciona.
 *
 * Dos recorridos en paralelo, uno por cada lado del marketplace, porque la
 * pregunta «cómo funciona» significa cosas distintas según de qué lado llegues.
 */
@Component({
  selector: 'rly-how-it-works-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  host: { class: 'block' },
  template: `
    <div class="container-page py-12 lg:py-16">
      <header class="max-w-2xl">
        <p class="text-label uppercase text-text-muted">Cómo funciona</p>
        <h1 class="mt-2 text-title-xl text-ink">
          Dos recorridos, un mismo registro de lo que pasa
        </h1>
        <p class="mt-4 text-body-lg text-text-secondary">
          RELAY es un marketplace de doble lado: quien tiene algo que vender publica las
          condiciones y quien tiene audiencia decide si encajan. Todo lo que ocurre después
          —solicitud, aprobación, clic, conversión, comisión— queda registrado para ambos.
        </p>
      </header>

      <section class="mt-14" aria-labelledby="afiliado">
        <div class="flex items-center gap-3">
          <span class="grid size-9 place-items-center rounded-sm bg-accent text-accent-contrast">
            <rly-icon name="profile" [size]="18" />
          </span>
          <h2 id="afiliado" class="text-title-sm text-ink">Si eres afiliado</h2>
        </div>

        <ol class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (step of affiliateSteps; track step.title; let index = $index) {
            <li class="flex flex-col rounded-lg border border-border bg-surface p-5">
              <span class="text-label tabular-nums text-text-muted">0{{ index + 1 }}</span>
              <span class="mt-3 flex size-9 items-center justify-center rounded-sm bg-surface-muted text-ink">
                <rly-icon [name]="step.icon" [size]="18" />
              </span>
              <h3 class="mt-4 text-title-xs text-ink">{{ step.title }}</h3>
              <p class="mt-2 text-ui text-text-secondary">{{ step.body }}</p>
            </li>
          }
        </ol>

        <a rlyButton variant="secondary" class="mt-6" routerLink="/marketplace">
          Explorar campañas
          <rly-icon name="arrow-right" [size]="16" />
        </a>
      </section>

      <section class="mt-16" aria-labelledby="empresa">
        <div class="flex items-center gap-3">
          <span class="grid size-9 place-items-center rounded-sm bg-ink text-accent">
            <rly-icon name="organization" [size]="18" />
          </span>
          <h2 id="empresa" class="text-title-sm text-ink">Si tienes algo que vender</h2>
        </div>

        <ol class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (step of organizationSteps; track step.title; let index = $index) {
            <li class="flex flex-col rounded-lg border border-border bg-surface p-5">
              <span class="text-label tabular-nums text-text-muted">0{{ index + 1 }}</span>
              <span class="mt-3 flex size-9 items-center justify-center rounded-sm bg-surface-muted text-ink">
                <rly-icon [name]="step.icon" [size]="18" />
              </span>
              <h3 class="mt-4 text-title-xs text-ink">{{ step.title }}</h3>
              <p class="mt-2 text-ui text-text-secondary">{{ step.body }}</p>
            </li>
          }
        </ol>

        <a rlyButton variant="secondary" class="mt-6" routerLink="/para-empresas">
          Ver la propuesta para empresas
          <rly-icon name="arrow-right" [size]="16" />
        </a>
      </section>
    </div>

    <!-- Qué es real y qué está simulado: es un proyecto de portafolio -->
    <section class="border-t border-border bg-surface section-y" aria-labelledby="alcance">
      <div class="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p class="text-label uppercase text-text-muted">Alcance del proyecto</p>
          <h2 id="alcance" class="mt-2 text-title-lg text-ink">
            RELAY es un proyecto de portafolio, no un servicio en producción
          </h2>
          <p class="mt-4 text-body text-text-secondary">
            La interfaz funciona de verdad: puedes buscar, filtrar, guardar, comparar, solicitar,
            aprobar, crear links y exportar. Lo que un backend haría —seguimiento real,
            atribución, cobros— está simulado y señalado como tal en la propia interfaz.
          </p>
        </div>

        <dl class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-lg border border-border bg-canvas p-5">
            <dt class="flex items-center gap-2 text-ui font-medium text-ink">
              <rly-icon name="check-circle" [size]="16" class="text-success" />
              Interactivo de verdad
            </dt>
            <dd class="mt-2 text-ui-sm text-text-secondary">
              Marketplace, filtros, guardados, comparación, solicitudes, wizard de campaña,
              links, códigos, exportación CSV y persistencia local.
            </dd>
          </div>

          <div class="rounded-lg border border-border bg-canvas p-5">
            <dt class="flex items-center gap-2 text-ui font-medium text-ink">
              <rly-icon name="info" [size]="16" class="text-info" />
              Simulado
            </dt>
            <dd class="mt-2 text-ui-sm text-text-secondary">
              Seguimiento de clics, atribución, Relay Score, validación de conversiones,
              recomendaciones, verificación y pagos.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  `,
})
export class HowItWorksPage {
  protected readonly affiliateSteps = AFFILIATE_STEPS;
  protected readonly organizationSteps = ORGANIZATION_STEPS;
}
