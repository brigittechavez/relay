import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { ORGANIZATION_KIND_LABELS, TRUST_SIGNAL_LABELS } from '@data/models/organization';
import { categoryLabel } from '@data/models/taxonomy';
import { Campaign } from '@data/models/campaign';
import { CampaignCard } from '@domain/campaign-card/campaign-card';
import { DatePipe, PercentPipe } from '@shared/pipes/format.pipes';

const TRUST_ICONS = {
  verified: 'verified',
  'on-time-payment': 'commissions',
  'fast-response': 'zap',
} as const;

/**
 * Perfil público de una organización.
 *
 * Las métricas que muestra —tiempo medio de revisión, tasa de aprobación,
 * campañas completadas— son las que un afiliado necesita para decidir si vale
 * la pena solicitar. RELAY no tiene reseñas: la confianza se construye con
 * datos operativos.
 */
@Component({
  selector: 'rly-organization-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Badge,
    Button,
    EmptyState,
    Icon,
    Skeleton,
    CampaignCard,
    DatePipe,
    PercentPipe,
  ],
  host: { class: 'block' },
  template: `
    @if (organization.isLoading()) {
      <div class="container-page flex max-w-4xl flex-col gap-4 py-12">
        <rly-skeleton shape="block" width="4rem" height="4rem" />
        <rly-skeleton width="40%" height="2rem" />
        <rly-skeleton width="70%" />
      </div>
    } @else if (organization.error()) {
      <div class="container-page py-16">
        <rly-empty-state
          icon="organization"
          title="Esta organización no está disponible"
          description="Puede que el enlace no sea correcto o que el perfil ya no sea público."
        >
          <a rlyButton variant="primary" routerLink="/marketplace">Ir al marketplace</a>
        </rly-empty-state>
      </div>
    } @else if (organization.value(); as org) {
      <article class="container-page py-10 lg:py-14">
        <header class="flex flex-col gap-6 sm:flex-row sm:items-start">
          <span
            class="grid size-16 shrink-0 place-items-center rounded-lg bg-ink text-title-sm
                   text-text-inverse"
            aria-hidden="true"
          >
            {{ org.initials }}
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-title-md text-ink">{{ org.name }}</h1>
              @if (org.trustSignals.includes('verified')) {
                <rly-icon
                  name="verified"
                  [size]="18"
                  class="text-info"
                  label="Organización verificada"
                />
              }
            </div>

            <p class="mt-1 text-ui text-text-secondary">
              {{ kindLabel() }} · {{ category() }} · {{ org.location }}
            </p>
            <p class="mt-3 max-w-2xl text-body-lg text-text-secondary">{{ org.tagline }}</p>

            <div class="mt-4 flex flex-wrap items-center gap-1.5">
              @for (signal of org.trustSignals; track signal) {
                <rly-badge tone="neutral" outline>
                  <rly-icon [name]="trustIcon(signal)" [size]="13" />
                  {{ trustLabel(signal) }}
                </rly-badge>
              }
            </div>
          </div>

          <a
            rlyButton
            variant="tertiary"
            class="shrink-0"
            [href]="'https://' + org.website"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ org.website }}
            <rly-icon name="external-link" [size]="14" />
          </a>
        </header>

        <!-- Métricas operativas -->
        <dl class="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <div class="bg-surface p-5">
            <dt class="text-ui-sm text-text-muted">Afiliados activos</dt>
            <dd class="mt-1 text-title-sm tabular-nums text-ink">
              {{ org.metrics.activeAffiliates }}
            </dd>
          </div>
          <div class="bg-surface p-5">
            <dt class="text-ui-sm text-text-muted">Tiempo medio de revisión</dt>
            <dd class="mt-1 text-title-sm tabular-nums text-ink">
              {{ org.metrics.averageReviewDays }} días
            </dd>
          </div>
          <div class="bg-surface p-5">
            <dt class="text-ui-sm text-text-muted">Tasa de aprobación</dt>
            <dd class="mt-1 text-title-sm tabular-nums text-ink">
              {{ org.metrics.approvalRate | rlyPercent: 0 }}
            </dd>
          </div>
          <div class="bg-surface p-5">
            <dt class="text-ui-sm text-text-muted">Campañas completadas</dt>
            <dd class="mt-1 text-title-sm tabular-nums text-ink">
              {{ org.metrics.completedCampaigns }}
            </dd>
          </div>
        </dl>

        <section class="mt-10" aria-labelledby="sobre">
          <h2 id="sobre" class="text-title-xs text-ink">Sobre {{ org.name }}</h2>
          <p class="mt-3 max-w-prose text-body text-text-secondary">{{ org.description }}</p>
          <p class="mt-4 text-ui-sm text-text-muted">
            En RELAY desde {{ org.createdAt | rlyDate }}
          </p>
        </section>

        <section class="mt-12" aria-labelledby="campanas">
          <h2 id="campanas" class="text-title-sm text-ink">Campañas activas</h2>

          @if (activeCampaigns().length) {
            <div class="grid-cards mt-5">
              @for (campaign of activeCampaigns(); track campaign.id) {
                <rly-campaign-card
                  [campaign]="campaign"
                  [organization]="org"
                  [showSave]="false"
                />
              }
            </div>
          } @else {
            <p class="mt-3 text-ui text-text-secondary">
              {{ org.name }} no tiene campañas abiertas en este momento.
            </p>
          }
        </section>

        @if (pastCampaigns().length) {
          <section class="mt-12" aria-labelledby="historico">
            <h2 id="historico" class="text-title-xs text-ink">Campañas anteriores</h2>
            <ul class="mt-4 flex flex-col divide-y divide-border border-y border-border">
              @for (campaign of pastCampaigns(); track campaign.id) {
                <li class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <span class="text-ui text-ink">{{ campaign.name }}</span>
                  <span class="text-ui-sm tabular-nums text-text-secondary">
                    {{ campaign.metrics.conversions }} conversiones ·
                    {{ campaign.metrics.conversionRate | rlyPercent: 2 }} de conversión
                  </span>
                </li>
              }
            </ul>
          </section>
        }
      </article>
    }
  `,
})
export class OrganizationProfilePage {
  private readonly catalog = inject(CatalogRepository);

  readonly slug = input.required<string>();

  protected readonly organization = rxResource({
    params: () => this.slug(),
    stream: ({ params }) => this.catalog.organization(params),
  });

  private readonly campaigns = rxResource({
    params: () => this.organization.value()?.id,
    stream: ({ params }) =>
      this.catalog.listCampaigns({ organizationId: params, pageSize: 50, includeAll: true }),
  });

  private readonly items = computed<readonly Campaign[]>(
    () => this.campaigns.value()?.items ?? [],
  );

  protected readonly activeCampaigns = computed(() =>
    this.items().filter(
      (campaign) => campaign.status === 'active' || campaign.status === 'scheduled',
    ),
  );

  protected readonly pastCampaigns = computed(() =>
    this.items().filter((campaign) => campaign.status === 'ended' || campaign.status === 'paused'),
  );

  protected readonly kindLabel = computed(() => {
    const org = this.organization.value();
    return org ? ORGANIZATION_KIND_LABELS[org.kind] : '';
  });

  protected readonly category = computed(() => {
    const org = this.organization.value();
    return org ? categoryLabel(org.categoryId) : '';
  });

  protected trustLabel(signal: string): string {
    return TRUST_SIGNAL_LABELS[signal as keyof typeof TRUST_SIGNAL_LABELS] ?? signal;
  }

  protected trustIcon(signal: string) {
    return TRUST_ICONS[signal as keyof typeof TRUST_ICONS] ?? 'check';
  }
}
