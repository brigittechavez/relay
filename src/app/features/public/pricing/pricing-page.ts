import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';
import { AFFILIATE_PLAN, PLANS } from './plans';

/**
 * Planes.
 *
 * La página dice sin rodeos que no hay facturación: RELAY no integra pasarela
 * de pago y los planes existen para explicar el modelo de negocio del producto
 * ficticio, no para venderlo.
 */
@Component({
  selector: 'rly-pricing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Button, Icon],
  host: { class: 'block' },
  template: `
    <div class="container-page py-12 lg:py-16">
      <header class="max-w-2xl">
        <p class="text-label uppercase text-text-muted">Planes</p>
        <h1 class="mt-2 text-title-xl text-ink">
          Gratis para afiliados. Por volumen para organizaciones.
        </h1>
        <p class="mt-4 text-body-lg text-text-secondary">
          Quien promociona no paga nunca. Quien publica campañas paga según cuántas mantiene
          activas y qué modalidades necesita.
        </p>
      </header>

      <!-- Afiliados -->
      <section class="mt-12" aria-labelledby="afiliados">
        <div class="rounded-lg border border-ink bg-inverse p-6 sm:p-8">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div class="max-w-lg">
              <h2 id="afiliados" class="text-title-sm text-text-inverse">
                {{ affiliatePlan.name }}
              </h2>
              <p class="mt-1 text-title-md text-accent">{{ affiliatePlan.price }}</p>
              <p class="mt-3 text-ui text-text-inverse-secondary">
                Sin comisión de plataforma sobre lo que ganas y sin límite de campañas a las que
                puedes solicitar.
              </p>
            </div>

            <ul class="grid gap-2.5 sm:grid-cols-2 lg:max-w-md">
              @for (feature of affiliatePlan.features; track feature) {
                <li class="flex items-start gap-2 text-ui text-text-inverse-secondary">
                  <rly-icon name="check" [size]="15" class="mt-1 text-accent" />
                  <span>{{ feature }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </section>

      <!-- Organizaciones -->
      <section class="mt-14" aria-labelledby="organizaciones">
        <h2 id="organizaciones" class="text-title-sm text-ink">Para organizaciones</h2>

        <ul class="mt-6 grid gap-4 lg:grid-cols-3">
          @for (plan of plans; track plan.id) {
            <li
              class="flex flex-col rounded-lg border p-6"
              [class.border-border]="!plan.highlighted"
              [class.bg-surface]="!plan.highlighted"
              [class.border-ink]="plan.highlighted"
              [class.bg-canvas]="plan.highlighted"
            >
              <div class="flex items-start justify-between gap-3">
                <h3 class="text-title-xs text-ink">{{ plan.name }}</h3>
                @if (plan.highlighted) {
                  <rly-badge tone="accent">Más elegido</rly-badge>
                }
              </div>

              <p class="mt-1 text-ui-sm text-text-secondary">{{ plan.audience }}</p>

              <p class="mt-5 flex items-baseline gap-1.5">
                <span class="text-title-md text-ink">{{ plan.price }}</span>
                <span class="text-ui-sm text-text-muted">{{ plan.priceNote }}</span>
              </p>

              <p class="mt-3 text-ui text-text-secondary">{{ plan.summary }}</p>

              <ul class="mt-5 flex flex-1 flex-col gap-2.5 border-t border-border pt-5">
                @for (feature of plan.features; track feature) {
                  <li class="flex items-start gap-2 text-ui text-text-secondary">
                    <rly-icon name="check" [size]="15" class="mt-1 text-ink" />
                    <span>{{ feature }}</span>
                  </li>
                }

                @for (limit of plan.limits; track limit) {
                  <li class="flex items-start gap-2 text-ui text-text-muted">
                    <rly-icon name="close" [size]="15" class="mt-1" />
                    <span>{{ limit }}</span>
                  </li>
                }
              </ul>

              <a
                rlyButton
                [variant]="plan.highlighted ? 'primary' : 'tertiary'"
                block
                class="mt-6"
                routerLink="/registro"
              >
                Empezar con {{ plan.name }}
              </a>
            </li>
          }
        </ul>
      </section>

      <p
        class="mt-10 flex items-start gap-2.5 rounded-md border border-border bg-surface-muted
               px-4 py-3 text-ui-sm text-text-secondary"
      >
        <rly-icon name="info" [size]="16" class="mt-0.5 text-info" />
        <span>
          RELAY es un proyecto de portafolio: no procesa pagos ni gestiona suscripciones. Los
          planes forman parte del modelo de negocio ficticio y ningún botón de esta página inicia
          un cobro.
        </span>
      </p>
    </div>
  `,
})
export class PricingPage {
  protected readonly plans = PLANS;
  protected readonly affiliatePlan = AFFILIATE_PLAN;
}
