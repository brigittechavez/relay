import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';
import { Campaign } from '@data/models/campaign';
import { Organization } from '@data/models/organization';
import { commissionLabel } from '@data/logic/commission';
import { categoryLabel } from '@data/models/taxonomy';
import { CampaignCover } from '@domain/campaign-cover/campaign-cover';
import { CompactPipe, NumberPipe, PercentPipe } from '@shared/pipes/format.pipes';

/**
 * Hero de la portada.
 *
 * El bloque visual no es un mockup inventado: son campañas reales del
 * marketplace renderizadas sobre superficie oscura. Enseñar la aplicación de
 * verdad evita la incoherencia habitual entre el hero y el producto, y como la
 * portada se prerenderiza, el contenido viaja ya en el HTML.
 */
@Component({
  selector: 'rly-landing-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon, CampaignCover, CompactPipe, NumberPipe, PercentPipe],
  host: { class: 'relative block bg-inverse' },
  template: `
    <!-- El hero arranca bajo la cabecera transparente. -->
    <div class="container-page pb-16 pt-28 lg:pb-24 lg:pt-36">
      <div class="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p
            class="inline-flex items-center gap-2 rounded-full border border-border-inverse px-3
                   py-1.5 text-ui-sm text-text-inverse-secondary"
          >
            <span class="size-1.5 rounded-full bg-accent" aria-hidden="true"></span>
            Marketplace de afiliación · Perú
          </p>

          <h1 class="mt-6 text-display text-text-inverse">
            El relevo entre
            <!-- Los monogramas viven dentro de la frase: no son decoración,
                 son las organizaciones que están publicando ahora mismo. -->
            <span class="inline-flex translate-y-1 items-center -space-x-2 align-middle" aria-hidden="true">
              @for (initials of organizationMarks(); track initials) {
                <span
                  class="grid size-[0.85em] place-items-center rounded-full border-2
                         border-inverse bg-surface text-[0.3em] font-semibold text-ink"
                >
                  {{ initials }}
                </span>
              }
            </span>
            lo que ofreces y
            <span class="text-accent">quien sabe recomendarlo</span>
          </h1>

          <p class="mt-6 max-w-xl text-body-lg text-text-inverse-secondary">
            RELAY conecta empresas, estudios y profesionales con afiliados que ya tienen la
            audiencia adecuada. Comisiones explícitas, requisitos claros y resultados que se
            pueden seguir desde el primer clic.
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <a rlyButton variant="primary" size="lg" onInverse routerLink="/marketplace">
              Explorar el marketplace
              <rly-icon name="arrow-right" [size]="18" />
            </a>
            <a rlyButton variant="tertiary" size="lg" onInverse routerLink="/para-empresas">
              Crear un programa
            </a>
          </div>

          <dl class="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            <div>
              <dt class="text-ui-sm text-text-inverse-secondary">Campañas</dt>
              <dd class="mt-1 text-title-sm tabular-nums text-text-inverse">
                {{ campaignCount() | rlyNumber }}
              </dd>
            </div>
            <div>
              <dt class="text-ui-sm text-text-inverse-secondary">Afiliados</dt>
              <dd class="mt-1 text-title-sm tabular-nums text-text-inverse">
                {{ affiliateCount() | rlyCompact }}
              </dd>
            </div>
            <div>
              <dt class="text-ui-sm text-text-inverse-secondary">Conversión media</dt>
              <dd class="mt-1 text-title-sm tabular-nums text-text-inverse">
                {{ averageConversionRate() | rlyPercent: 2 }}
              </dd>
            </div>
            <div>
              <dt class="text-ui-sm text-text-inverse-secondary">Categorías</dt>
              <dd class="mt-1 text-title-sm tabular-nums text-text-inverse">8</dd>
            </div>
          </dl>
        </div>

        <!-- Muestra de campañas: la misma información que en el marketplace. -->
        <div class="relative" aria-hidden="true">
          <ul class="flex flex-col gap-3">
            @for (campaign of campaigns(); track campaign.id; let index = $index) {
              <li
                class="overflow-hidden rounded-lg border border-border-inverse bg-inverse-elevated"
                [class.lg:ml-10]="index === 1"
                [class.lg:mr-6]="index === 2"
              >
                <div class="flex items-stretch gap-4">
                  <rly-campaign-cover
                    [cover]="campaign.cover"
                    [categoryId]="campaign.categoryId"
                    featured
                    class="w-24 shrink-0 sm:w-32"
                  />

                  <div class="min-w-0 flex-1 py-4 pr-4">
                    <p class="truncate text-ui-sm text-text-inverse-secondary">
                      {{ organizationName(campaign) }} · {{ category(campaign) }}
                    </p>
                    <p class="mt-0.5 truncate text-title-xs text-text-inverse">
                      {{ campaign.name }}
                    </p>
                    <p class="mt-2 text-ui font-medium text-accent">{{ commission(campaign) }}</p>
                  </div>
                </div>
              </li>
            }
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class LandingHero {
  readonly campaigns = input.required<readonly Campaign[]>();
  readonly organizations = input.required<readonly Organization[]>();
  readonly campaignCount = input(0);
  readonly affiliateCount = input(0);
  readonly averageConversionRate = input(0);

  /** Monogramas de las primeras organizaciones, para el titular. */
  protected readonly organizationMarks = computed(() =>
    this.organizations()
      .slice(0, 3)
      .map((organization) => organization.initials),
  );

  protected organizationName(campaign: Campaign): string {
    return this.organizations().find((item) => item.id === campaign.organizationId)?.name ?? '';
  }

  protected category(campaign: Campaign): string {
    return categoryLabel(campaign.categoryId);
  }

  protected commission(campaign: Campaign): string {
    return commissionLabel(campaign);
  }
}
