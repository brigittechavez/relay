import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { BADGE_LABELS, totalAudience } from '@data/models/affiliate';
import {
  AFFILIATE_TYPE_LABELS,
  NICHE_LABELS,
  categoryLabel,
  channelIcon,
  channelLabel,
} from '@data/models/taxonomy';
import { computeMatchScore } from '@data/logic/matching';
import { CAMPAIGNS } from '@data/seed/campaigns.seed';
import { MatchScore } from '@domain/match-score/match-score';
import { RelayScore } from '@domain/relay-score/relay-score';
import { CompactPipe, DatePipe, PercentPipe } from '@shared/pipes/format.pipes';

/**
 * Perfil público de un afiliado.
 *
 * Los controles de visibilidad del propio perfil se respetan aquí: si alguien
 * oculta su audiencia o su Relay Score, esta página no los muestra. Los datos
 * financieros no aparecen nunca, sean cuales sean los ajustes.
 *
 * Cuando se llega desde una campaña (`?campana=`) se añade la compatibilidad
 * contextual, que es la pregunta que se hace una organización al revisar.
 */
@Component({
  selector: 'rly-affiliate-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Badge,
    Button,
    EmptyState,
    Icon,
    Skeleton,
    MatchScore,
    RelayScore,
    CompactPipe,
    DatePipe,
    PercentPipe,
  ],
  host: { class: 'block' },
  template: `
    @if (affiliate.isLoading()) {
      <div class="container-page flex max-w-4xl flex-col gap-4 py-12">
        <rly-skeleton shape="circle" width="4rem" height="4rem" />
        <rly-skeleton width="40%" height="2rem" />
        <rly-skeleton width="70%" />
      </div>
    } @else if (affiliate.error()) {
      <div class="container-page py-16">
        <rly-empty-state
          icon="profile"
          title="Este perfil no está disponible"
          description="Puede que el enlace no sea correcto o que el perfil ya no sea público."
        >
          <a rlyButton variant="primary" routerLink="/marketplace">Ir al marketplace</a>
        </rly-empty-state>
      </div>
    } @else if (affiliate.value(); as person) {
      <article class="container-page py-10 lg:py-14">
        <header class="flex flex-col gap-6 sm:flex-row sm:items-start">
          <span
            class="grid size-16 shrink-0 place-items-center rounded-lg bg-ink text-title-sm
                   text-text-inverse"
            aria-hidden="true"
          >
            {{ person.initials }}
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-title-md text-ink">{{ person.name }}</h1>
              @if (person.badges.includes('verified')) {
                <rly-icon name="verified" [size]="18" class="text-info" label="Perfil verificado" />
              }
            </div>

            <p class="mt-1 text-ui text-text-secondary">
              {{ typeLabel() }} · {{ person.location }}
            </p>
            <p class="mt-3 max-w-2xl text-body-lg text-text-secondary">{{ person.headline }}</p>

            <div class="mt-4 flex flex-wrap items-center gap-1.5">
              @if (person.visibility.availability) {
                <rly-badge [tone]="person.available ? 'success' : 'neutral'" dot>
                  {{ person.available ? 'Disponible para campañas' : 'Sin disponibilidad' }}
                </rly-badge>
              }
              @for (badge of person.badges; track badge) {
                <rly-badge tone="neutral" outline>{{ badgeLabel(badge) }}</rly-badge>
              }
            </div>
          </div>

          @if (contextMatch() !== null) {
            <div class="shrink-0 rounded-lg border border-border bg-surface p-4 text-center">
              <rly-match-score [value]="contextMatch()!" size="lg" [showLabel]="false" class="justify-center" />
              <p class="mt-2 text-ui-sm text-text-secondary">
                con <span class="font-medium text-ink">{{ contextCampaignName() }}</span>
              </p>
            </div>
          }
        </header>

        <div class="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <div class="min-w-0">
            <section aria-labelledby="sobre">
              <h2 id="sobre" class="text-title-xs text-ink">Sobre {{ firstName() }}</h2>
              <p class="mt-3 max-w-prose text-body text-text-secondary">{{ person.bio }}</p>
            </section>

            <section class="mt-10" aria-labelledby="nichos">
              <h2 id="nichos" class="text-title-xs text-ink">Nichos</h2>
              <ul class="mt-3 flex flex-wrap gap-1.5">
                @for (niche of person.niches; track niche) {
                  <li><rly-badge tone="neutral" outline>{{ nicheLabel(niche) }}</rly-badge></li>
                }
              </ul>
            </section>

            @if (person.visibility.channels) {
              <section class="mt-10" aria-labelledby="canales">
                <h2 id="canales" class="text-title-xs text-ink">Canales</h2>
                <ul class="mt-3 grid gap-3 sm:grid-cols-2">
                  @for (channel of person.channels; track channel.id) {
                    <li class="flex items-center gap-3 rounded-md border border-border bg-surface p-4">
                      <span
                        class="grid size-9 shrink-0 place-items-center rounded-sm bg-surface-muted
                               text-text-secondary"
                        aria-hidden="true"
                      >
                        <rly-icon [name]="iconFor(channel.id)" [size]="16" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-ui font-medium text-ink">
                          {{ labelFor(channel.id) }}
                        </span>
                        <span class="block truncate text-ui-sm text-text-muted">
                          {{ channel.handle }}
                        </span>
                      </span>
                      @if (person.visibility.audience) {
                        <span class="shrink-0 text-ui tabular-nums text-ink">
                          {{ channel.audience | rlyCompact }}
                        </span>
                      }
                    </li>
                  }
                </ul>
              </section>
            }

            @if (person.visibility.results && person.portfolio.length) {
              <section class="mt-10" aria-labelledby="resultados">
                <h2 id="resultados" class="text-title-xs text-ink">Resultados seleccionados</h2>
                <ul class="mt-3 flex flex-col gap-2">
                  @for (result of person.portfolio; track result.campaignName) {
                    <li
                      class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1
                             rounded-md border border-border bg-surface p-4"
                    >
                      <span class="min-w-0">
                        <span class="block text-ui font-medium text-ink">
                          {{ result.campaignName }}
                        </span>
                        <span class="block text-ui-sm text-text-secondary">
                          {{ result.organizationName }}
                        </span>
                      </span>
                      <span class="text-ui-sm tabular-nums text-text-secondary">
                        <span class="font-medium text-ink">{{ result.conversions }}</span>
                        conversiones ·
                        <span class="font-medium text-ink">
                          {{ result.conversionRate | rlyPercent: 1 }}
                        </span>
                        de conversión
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }

            @if (person.experience.length) {
              <section class="mt-10" aria-labelledby="experiencia">
                <h2 id="experiencia" class="text-title-xs text-ink">Experiencia por categoría</h2>
                <ul class="mt-3 flex flex-col divide-y divide-border border-y border-border">
                  @for (item of person.experience; track item.categoryId) {
                    <li class="flex items-baseline justify-between gap-4 py-3">
                      <span class="text-ui text-ink">{{ category(item.categoryId) }}</span>
                      <span class="text-ui-sm tabular-nums text-text-secondary">
                        {{ item.campaigns }} campañas · {{ item.conversions }} conversiones
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>

          <aside class="flex flex-col gap-6">
            @if (person.visibility.relayScore) {
              <div class="rounded-lg border border-border bg-surface p-5">
                <h2 class="text-title-xs text-ink">Relay Score</h2>
                <rly-relay-score class="mt-4" [affiliate]="person" />
              </div>
            }

            <dl class="rounded-lg border border-border bg-surface p-5">
              @if (person.visibility.audience) {
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-ui-sm text-text-secondary">Audiencia total</dt>
                  <dd class="text-ui font-medium tabular-nums text-ink">
                    {{ audience() | rlyCompact }}
                  </dd>
                </div>
              }
              <div class="mt-3 flex items-baseline justify-between gap-3">
                <dt class="text-ui-sm text-text-secondary">Conversión media</dt>
                <dd class="text-ui font-medium tabular-nums text-ink">
                  {{ person.averageConversionRate | rlyPercent: 2 }}
                </dd>
              </div>
              <div class="mt-3 flex items-baseline justify-between gap-3">
                <dt class="text-ui-sm text-text-secondary">En RELAY desde</dt>
                <dd class="text-ui font-medium text-ink">{{ person.joinedAt | rlyDate }}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </article>
    }
  `,
})
export class AffiliateProfilePage {
  private readonly catalog = inject(CatalogRepository);

  readonly slug = input.required<string>();

  /** Campaña de contexto, cuando la organización llega desde una revisión. */
  readonly campana = input<string | undefined>(undefined);

  protected readonly affiliate = rxResource({
    params: () => this.slug(),
    stream: ({ params }) => this.catalog.affiliate(params),
  });

  private readonly contextCampaign = computed(
    () => CAMPAIGNS.find((campaign) => campaign.slug === this.campana()) ?? null,
  );

  protected readonly contextCampaignName = computed(() => this.contextCampaign()?.name ?? '');

  protected readonly contextMatch = computed(() => {
    const person = this.affiliate.value();
    const campaign = this.contextCampaign();
    return person && campaign ? computeMatchScore(person, campaign) : null;
  });

  protected readonly audience = computed(() => {
    const person = this.affiliate.value();
    return person ? totalAudience(person) : 0;
  });

  protected readonly typeLabel = computed(() => {
    const person = this.affiliate.value();
    return person ? AFFILIATE_TYPE_LABELS[person.type] : '';
  });

  protected readonly firstName = computed(
    () => this.affiliate.value()?.name.split(' ')[0] ?? '',
  );

  protected badgeLabel(badge: string): string {
    return BADGE_LABELS[badge as keyof typeof BADGE_LABELS] ?? badge;
  }

  protected nicheLabel(niche: string): string {
    return NICHE_LABELS[niche as keyof typeof NICHE_LABELS] ?? niche;
  }

  protected category(id: string): string {
    return categoryLabel(id as never);
  }

  protected iconFor(channel: string) {
    return channelIcon(channel as never);
  }

  protected labelFor(channel: string): string {
    return channelLabel(channel as never);
  }
}
