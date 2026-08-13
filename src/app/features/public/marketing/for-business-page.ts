import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';
import { IconName } from '@ds/icon/icon-registry.generated';

interface Benefit {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
}

const BENEFITS: readonly Benefit[] = [
  {
    icon: 'commissions',
    title: 'Pagas por resultado, no por alcance',
    body:
      'Tú defines qué conversión genera comisión: una venta, una suscripción activa, una ' +
      'inscripción pagada o un cliente cerrado. No hay tarifa por publicación.',
  },
  {
    icon: 'applications',
    title: 'Eliges con quién trabajas',
    body:
      'Tres modalidades de acceso. Abierta cuando buscas volumen, selectiva cuando quieres ' +
      'revisar, premium cuando el perfil importa más que el número.',
  },
  {
    icon: 'target',
    title: 'Requisitos que filtran de verdad',
    body:
      'Nivel, Relay Score, nicho, canal, país y completitud de perfil. Quien no cumple lo ' +
      'obligatorio no llega a tu bandeja, y quien llega trae su compatibilidad calculada.',
  },
  {
    icon: 'analytics',
    title: 'Todo el recorrido medido',
    body:
      'Clics, conversiones, revenue atribuido y comisiones pendientes, por campaña, por ' +
      'afiliado y por canal. Sin salir de la campaña.',
  },
];

const OBJECTIONS = [
  {
    question: '¿Y si nadie relevante solicita?',
    answer:
      'El descubrimiento de afiliados funciona en las dos direcciones: puedes filtrar por nicho, ' +
      'nivel, canal y audiencia, guardar perfiles e invitarlos a tu campaña.',
  },
  {
    question: '¿Cómo evito pagar por conversiones que se caen?',
    answer:
      'Ninguna comisión se paga sola. Cada conversión pasa por validación y solo cuando la ' +
      'apruebas entra en el ciclo de pago. Un reembolso anula la comisión asociada.',
  },
  {
    question: '¿Tengo que negociar cada colaboración?',
    answer:
      'No. Las condiciones se publican una vez en la campaña y aplican a todos por igual: ' +
      'comisión, evento de conversión, ventana de atribución, canales y restricciones.',
  },
];

/**
 * Página B2B.
 *
 * Se estructura alrededor de las objeciones reales de quien va a montar un
 * programa de afiliación, no alrededor de una lista de funcionalidades.
 */
@Component({
  selector: 'rly-for-business-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  host: { class: 'block' },
  template: `
    <section class="bg-inverse">
      <div class="container-page py-16 lg:py-24">
        <div class="max-w-3xl">
          <p class="text-label uppercase text-accent">Para empresas y profesionales</p>
          <h1 class="mt-3 text-title-xl text-text-inverse">
            Convierte a quien ya te recomienda en un canal medible
          </h1>
          <p class="mt-5 max-w-xl text-body-lg text-text-inverse-secondary">
            Publica tu programa una vez y deja que creadores, comunidades y profesionales se
            sumen con condiciones idénticas. Tú apruebas, tú validas y tú decides cuándo pagar.
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              rlyButton
              variant="primary"
              size="lg"
              onInverse
              routerLink="/app/organization/norte-digital/overview"
            >
              Ver demo como empresa
              <rly-icon name="arrow-right" [size]="18" />
            </a>
            <a rlyButton variant="tertiary" size="lg" onInverse routerLink="/pricing">
              Ver planes
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="container-page section-y" aria-labelledby="beneficios">
      <h2 id="beneficios" class="max-w-xl text-title-lg text-ink">
        Lo que cambia respecto a acordar colaboraciones una a una
      </h2>

      <ul class="mt-8 grid gap-4 sm:grid-cols-2">
        @for (benefit of benefits; track benefit.title) {
          <li class="rounded-lg border border-border bg-surface p-6">
            <span
              class="grid size-10 place-items-center rounded-sm bg-surface-muted text-ink"
              aria-hidden="true"
            >
              <rly-icon [name]="benefit.icon" [size]="20" />
            </span>
            <h3 class="mt-4 text-title-xs text-ink">{{ benefit.title }}</h3>
            <p class="mt-2 text-ui text-text-secondary">{{ benefit.body }}</p>
          </li>
        }
      </ul>
    </section>

    <section class="border-t border-border bg-surface section-y" aria-labelledby="dudas">
      <div class="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p class="text-label uppercase text-text-muted">Antes de empezar</p>
          <h2 id="dudas" class="mt-2 text-title-lg text-ink">Las tres dudas de siempre</h2>
        </div>

        <dl class="flex flex-col">
          @for (item of objections; track item.question) {
            <div class="border-t border-border py-6 first:border-t-0 first:pt-0">
              <dt class="text-title-xs text-ink">{{ item.question }}</dt>
              <dd class="mt-2 max-w-prose text-body text-text-secondary">{{ item.answer }}</dd>
            </div>
          }
        </dl>
      </div>
    </section>

    <section class="container-page section-y">
      <div class="rounded-lg border border-border bg-canvas p-8 text-center sm:p-12">
        <h2 class="mx-auto max-w-xl text-title-lg text-ink">
          Entra como Norte Digital y revisa tres solicitudes reales de la demo
        </h2>
        <p class="mx-auto mt-3 max-w-lg text-body text-text-secondary">
          Verás el panel con revenue atribuido, conversiones por validar y la campaña Landing Pro
          con datos ya cargados.
        </p>

        <a
          rlyButton
          variant="primary"
          size="lg"
          class="mt-6"
          routerLink="/app/organization/norte-digital/overview"
        >
          Abrir la demo de empresa
        </a>
      </div>
    </section>
  `,
})
export class ForBusinessPage {
  protected readonly benefits = BENEFITS;
  protected readonly objections = OBJECTIONS;
}
