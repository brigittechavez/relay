import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { CampaignStatus } from '@data/models/campaign';
import { totals } from '@data/logic/analytics';
import { commissionLabel } from '@data/logic/commission';
import { CampaignCover } from '@domain/campaign-cover/campaign-cover';
import { AccessBadge, CampaignStatusBadge } from '@domain/status/status-badges';
import { MoneyPipe, NumberPipe } from '@shared/pipes/format.pipes';

type Filter = 'all' | CampaignStatus;

/**
 * Campañas de la organización.
 *
 * Cada fila lleva las cifras que deciden si una campaña merece atención:
 * afiliados activos, conversiones y revenue atribuido. El detalle vive dentro
 * de cada campaña.
 */
@Component({
  selector: 'rly-organization-campaigns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    Chip,
    EmptyState,
    Icon,
    Skeleton,
    CampaignCover,
    AccessBadge,
    CampaignStatusBadge,
    MoneyPipe,
    NumberPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Campañas</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Programas de afiliación publicados por tu organización.
          </p>
        </div>

        <a
          rlyButton
          variant="primary"
          [routerLink]="['/app/organization', organizationId(), 'campanas', 'nueva']"
        >
          <rly-icon name="plus" [size]="16" />
          Crear campaña
        </a>
      </header>

      <div class="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        @for (option of filters; track option.id) {
          <rly-chip
            [selected]="filter() === option.id"
            [count]="countFor(option.id)"
            (toggled)="filter.set(option.id)"
          >
            {{ option.label }}
          </rly-chip>
        }
      </div>

      @if (campaigns.isLoading()) {
        <div class="mt-6 flex flex-col gap-2">
          @for (item of [1, 2, 3]; track item) {
            <rly-skeleton shape="block" height="7rem" />
          }
        </div>
      } @else if (!rows().length) {
        <div class="mt-6 rounded-lg border border-border bg-surface">
          <rly-empty-state
            icon="campaigns"
            [title]="emptyTitle()"
            description="Define qué conversión genera comisión y quién puede promocionarla."
          >
            <a
              rlyButton
              variant="primary"
              [routerLink]="['/app/organization', organizationId(), 'campanas', 'nueva']"
            >
              Crear campaña
            </a>
          </rly-empty-state>
        </div>
      } @else {
        <ul class="mt-6 flex flex-col gap-3">
          @for (row of rows(); track row.campaign.id) {
            <li>
              <a
                [routerLink]="[
                  '/app/organization',
                  organizationId(),
                  'campanas',
                  row.campaign.id,
                  'resumen',
                ]"
                class="focus-ring flex items-stretch gap-4 overflow-hidden rounded-lg border
                       border-border bg-surface transition-colors duration-micro
                       hover:border-border-strong"
              >
                <rly-campaign-cover
                  [cover]="row.campaign.cover"
                  [categoryId]="row.campaign.categoryId"
                  [image]="row.campaign.image"
                  class="hidden w-32 shrink-0 sm:block"
                />

                <span class="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-3 p-4">
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-ui font-medium text-ink">
                      {{ row.campaign.name }}
                    </span>
                    <span class="mt-1 flex flex-wrap items-center gap-1.5">
                      <rly-campaign-status [status]="row.campaign.status" />
                      <rly-access-badge [access]="row.campaign.access" internal outline />
                    </span>
                    <span class="mt-1.5 block text-ui-sm text-text-secondary">
                      {{ commission(row.campaign) }}
                    </span>
                  </span>

                  <span class="text-right">
                    <span class="block text-ui-sm text-text-muted">Afiliados</span>
                    <span class="block text-ui tabular-nums text-ink">{{ row.affiliates }}</span>
                  </span>

                  <span class="text-right">
                    <span class="block text-ui-sm text-text-muted">Conversiones</span>
                    <span class="block text-ui tabular-nums text-ink">
                      {{ row.conversions | rlyNumber }}
                    </span>
                  </span>

                  <span class="text-right">
                    <span class="block text-ui-sm text-text-muted">Revenue</span>
                    <span class="block text-ui font-medium tabular-nums text-ink">
                      {{ row.revenue | rlyMoney }}
                    </span>
                  </span>

                  <rly-icon name="chevron-right" [size]="16" class="text-text-muted" />
                </span>
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class OrganizationCampaignsPage {
  private readonly catalog = inject(CatalogRepository);
  private readonly engagement = inject(EngagementRepository);

  readonly organizationId = input.required<string>();

  protected readonly filter = signal<Filter>('all');

  protected readonly filters: readonly { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'active', label: 'Activas' },
    { id: 'paused', label: 'Pausadas' },
    { id: 'draft', label: 'Borradores' },
    { id: 'ended', label: 'Finalizadas' },
  ];

  protected readonly campaigns = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) =>
      this.catalog.listCampaigns({ organizationId: params, pageSize: 50, includeAll: true }),
  });

  private readonly conversions = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.engagement.listConversions({ organizationId: params }),
    defaultValue: [],
  });

  private readonly partnerships = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.engagement.listPartnerships({ organizationId: params }),
    defaultValue: [],
  });

  private readonly allRows = computed(() =>
    (this.campaigns.value()?.items ?? [])
      .map((campaign) => {
        const stats = totals(
          this.conversions.value().filter((item) => item.campaignId === campaign.id),
        );
        const affiliates = new Set(
          this.partnerships
            .value()
            .filter((item) => item.campaignId === campaign.id && item.status === 'active')
            .map((item) => item.affiliateId),
        ).size;

        return { campaign, affiliates, conversions: stats.conversions, revenue: stats.revenue };
      })
      .sort((a, b) => b.revenue - a.revenue),
  );

  protected readonly rows = computed(() => {
    const filter = this.filter();
    return filter === 'all'
      ? this.allRows()
      : this.allRows().filter((row) => row.campaign.status === filter);
  });

  protected readonly emptyTitle = computed(() =>
    this.filter() === 'all'
      ? 'Todavía no has publicado ninguna campaña'
      : 'Ninguna campaña en este estado',
  );

  protected countFor(filter: Filter): number | null {
    if (filter === 'all') return this.allRows().length;

    const count = this.allRows().filter((row) => row.campaign.status === filter).length;
    return count || null;
  }

  protected commission(campaign: Parameters<typeof commissionLabel>[0]): string {
    return commissionLabel(campaign);
  }
}
