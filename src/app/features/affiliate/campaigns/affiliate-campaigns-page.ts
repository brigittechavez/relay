import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { PartnershipStatus } from '@data/models/tracking';
import { totals } from '@data/logic/analytics';
import { CampaignCover } from '@domain/campaign-cover/campaign-cover';
import { PartnershipStatusBadge } from '@domain/status/status-badges';
import { MoneyPipe, NumberPipe, PercentPipe } from '@shared/pipes/format.pipes';

type Filter = 'all' | PartnershipStatus;

/**
 * Campañas en las que el afiliado participa.
 *
 * Cada fila lleva sus cifras acumuladas porque es la pregunta inmediata al
 * abrir esta lista: cuál está funcionando. El detalle vive en el espacio de
 * cada campaña.
 */
@Component({
  selector: 'rly-affiliate-campaigns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    Chip,
    EmptyState,
    Icon,
    Skeleton,
    CampaignCover,
    PartnershipStatusBadge,
    MoneyPipe,
    NumberPipe,
    PercentPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Mis campañas</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Campañas en las que estás activo, en pausa o que ya terminaron.
          </p>
        </div>

        <a rlyButton variant="tertiary" routerLink="/app/affiliate/marketplace">
          Buscar más campañas
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

      @if (loading()) {
        <div class="mt-6 flex flex-col gap-2">
          @for (item of [1, 2, 3]; track item) {
            <rly-skeleton shape="block" height="6.5rem" />
          }
        </div>
      } @else if (!rows().length) {
        <div class="mt-6 rounded-lg border border-border bg-surface">
          <rly-empty-state
            icon="campaigns"
            title="Todavía no estás en ninguna campaña"
            description="Cuando una organización apruebe tu solicitud, la campaña aparecerá aquí con sus resultados."
          >
            <a rlyButton variant="primary" routerLink="/app/affiliate/marketplace">
              Explorar el marketplace
            </a>
          </rly-empty-state>
        </div>
      } @else {
        <ul class="mt-6 flex flex-col gap-3">
          @for (row of rows(); track row.partnership.id) {
            <li>
              <a
                [routerLink]="['/app/affiliate/campanas', row.campaign.id]"
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
                    <span class="block truncate text-ui-sm text-text-secondary">
                      {{ organizationName(row.campaign.organizationId) }}
                    </span>
                    <rly-partnership-status class="mt-2" [status]="row.partnership.status" />
                  </span>

                  <span class="text-right">
                    <span class="block text-ui-sm text-text-muted">Clics</span>
                    <span class="block text-ui tabular-nums text-ink">
                      {{ row.clicks | rlyNumber }}
                    </span>
                  </span>

                  <span class="text-right">
                    <span class="block text-ui-sm text-text-muted">Conversiones</span>
                    <span class="block text-ui tabular-nums text-ink">
                      {{ row.conversions | rlyNumber }}
                    </span>
                  </span>

                  <span class="text-right">
                    <span class="block text-ui-sm text-text-muted">CVR</span>
                    <span class="block text-ui tabular-nums text-ink">
                      {{ row.conversionRate | rlyPercent: 2 }}
                    </span>
                  </span>

                  <span class="text-right">
                    <span class="block text-ui-sm text-text-muted">Comisión</span>
                    <span class="block text-ui font-medium tabular-nums text-ink">
                      {{ row.commission | rlyMoney }}
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
export class AffiliateCampaignsPage {
  private readonly session = inject(SessionStore);
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);

  protected readonly filter = signal<Filter>('all');

  protected readonly filters: readonly { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'active', label: 'Activas' },
    { id: 'paused', label: 'Pausadas' },
    { id: 'ended', label: 'Finalizadas' },
  ];

  private readonly affiliateId = computed(() => this.session.affiliate()?.id ?? null);

  private readonly partnerships = rxResource({
    params: () => this.affiliateId(),
    stream: ({ params }) => this.engagement.listPartnerships({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly conversions = rxResource({
    params: () => this.affiliateId(),
    stream: ({ params }) => this.engagement.listConversions({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly links = rxResource({
    params: () => this.affiliateId(),
    stream: ({ params }) => this.engagement.listLinks({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    stream: () => this.catalog.listCampaigns({ pageSize: 50, includeAll: true }),
  });

  private readonly organizations = rxResource({
    stream: () => this.catalog.listOrganizations(),
    defaultValue: [],
  });

  protected readonly loading = computed(
    () => this.partnerships.isLoading() || this.campaigns.isLoading(),
  );

  private readonly allRows = computed(() => {
    const byId = new Map((this.campaigns.value()?.items ?? []).map((item) => [item.id, item]));

    return this.partnerships
      .value()
      .map((partnership) => {
        const campaign = byId.get(partnership.campaignId);
        if (!campaign) return null;

        const stats = totals(
          this.conversions.value().filter((item) => item.campaignId === partnership.campaignId),
        );
        const clicks = this.links
          .value()
          .filter((link) => link.campaignId === partnership.campaignId)
          .reduce((total, link) => total + link.clicks, 0);

        return {
          partnership,
          campaign,
          clicks,
          conversions: stats.conversions,
          commission: stats.commission,
          conversionRate: clicks ? (stats.conversions / clicks) * 100 : 0,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.commission - a.commission);
  });

  protected readonly rows = computed(() => {
    const filter = this.filter();
    return filter === 'all'
      ? this.allRows()
      : this.allRows().filter((row) => row.partnership.status === filter);
  });

  protected countFor(filter: Filter): number | null {
    if (filter === 'all') return this.allRows().length;

    const count = this.allRows().filter((row) => row.partnership.status === filter).length;
    return count || null;
  }

  protected organizationName(organizationId: string): string {
    return (
      this.organizations.value().find((item) => item.id === organizationId)?.name ?? organizationId
    );
  }
}
