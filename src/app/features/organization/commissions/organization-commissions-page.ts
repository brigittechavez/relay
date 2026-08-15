import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { ToastService } from '@ds/toast/toast.service';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { ConversionStatus } from '@data/models/tracking';
import { totals } from '@data/logic/analytics';
import { DEMO_TODAY } from '@data/seed/demo-clock';
import { KpiCard } from '@domain/kpi/kpi-card';
import { ConversionStatusBadge } from '@domain/status/status-badges';
import { csvFilename, downloadCsv, toCsv } from '@shared/utils/csv';
import { formatCurrency } from '@shared/utils/format';
import { DatePipe, MoneyPipe } from '@shared/pipes/format.pipes';

type Filter = 'all' | 'pending' | 'approved' | 'paid' | 'closed';

const GROUPS: Record<Filter, readonly ConversionStatus[]> = {
  all: [],
  pending: ['registered', 'validating'],
  approved: ['approved', 'scheduled'],
  paid: ['paid'],
  closed: ['rejected', 'refunded'],
};

/**
 * Comisiones de la organización.
 *
 * Es la misma información que la tabla de conversiones leída desde el dinero:
 * cuánto está en el aire, cuánto se debe y cuánto se ha pagado. Agrupa por
 * afiliado, que es como se resuelve un pago.
 */
@Component({
  selector: 'rly-organization-commissions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    Chip,
    EmptyState,
    Icon,
    Skeleton,
    KpiCard,
    ConversionStatusBadge,
    DatePipe,
    MoneyPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Comisiones</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Lo que has generado con afiliación y en qué punto está cada pago.
          </p>
        </div>

        <button
          rlyButton
          variant="tertiary"
          type="button"
          [disabled]="!visible().length"
          (click)="exportCsv()"
        >
          <rly-icon name="download" [size]="16" />
          Exportar CSV
        </button>
      </header>

      @if (conversions.isLoading()) {
        <rly-skeleton class="mt-6" shape="block" height="16rem" />
      } @else {
        <div class="mt-6 grid gap-4 sm:grid-cols-3">
          <rly-kpi-card
            label="Pendiente de validar"
            [value]="summary().pending | rlyMoney"
            inverted
          />
          <rly-kpi-card
            label="Aprobado por pagar"
            [value]="summary().available | rlyMoney"
            inverted
          />
          <rly-kpi-card label="Pagado" [value]="summary().paid | rlyMoney" />
        </div>

        <section class="mt-8" aria-labelledby="por-afiliado">
          <h3 id="por-afiliado" class="text-title-xs text-ink">Por afiliado</h3>

          @if (byAffiliate().length) {
            <ul class="mt-4 flex flex-col gap-2">
              @for (row of byAffiliate(); track row.affiliateId) {
                <li
                  class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 rounded-lg border border-border
                         bg-surface p-4"
                >
                  <span class="min-w-0 flex-1 text-ui font-medium text-ink">
                    {{ affiliateName(row.affiliateId) }}
                  </span>

                  <span class="grid grid-cols-2 gap-x-4 gap-y-3 sm:contents">
                    <span class="sm:text-right">
                      <span class="block text-ui-sm text-text-muted">Pendiente</span>
                      <span class="block text-ui tabular-nums text-ink">
                        {{ row.pending | rlyMoney }}
                      </span>
                    </span>

                    <span class="sm:text-right">
                      <span class="block text-ui-sm text-text-muted">Por pagar</span>
                      <span class="block text-ui tabular-nums text-ink">
                        {{ row.available | rlyMoney }}
                      </span>
                    </span>

                    <span class="sm:text-right">
                      <span class="block text-ui-sm text-text-muted">Pagado</span>
                      <span class="block text-ui font-medium tabular-nums text-ink">
                        {{ row.paid | rlyMoney }}
                      </span>
                    </span>
                  </span>
                </li>
              }
            </ul>
          } @else {
            <p class="mt-3 text-ui text-text-secondary">Todavía no hay comisiones generadas.</p>
          }
        </section>

        <section class="mt-8" aria-labelledby="detalle">
          <h3 id="detalle" class="text-title-xs text-ink">Detalle</h3>

          <div class="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
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

          @if (!visible().length) {
            <div class="mt-4 rounded-lg border border-border bg-surface">
              <rly-empty-state
                icon="commissions"
                title="Ninguna comisión en este estado"
                description="Las comisiones se generan cuando una conversión se registra en una de tus campañas."
              />
            </div>
          } @else {
            <ul class="mt-4 flex flex-col gap-2">
              @for (conversion of visible(); track conversion.id) {
                <li
                  class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 rounded-lg border border-border
                         bg-surface p-4"
                >
                  <span class="shrink-0 font-mono sm:w-24 text-ui-sm text-text-muted">
                    {{ conversion.id }}
                  </span>

                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-ui text-ink">
                      {{ affiliateName(conversion.affiliateId) }}
                    </span>
                    <span class="block truncate text-ui-sm text-text-secondary">
                      {{ campaignName(conversion.campaignId) }} ·
                      {{ conversion.occurredAt | rlyDate }}
                    </span>
                  </span>

                  <rly-conversion-status [status]="conversion.status" />

                  <span class="sm:w-24 sm:text-right text-ui font-medium tabular-nums text-ink">
                    {{ conversion.commission | rlyMoney }}
                  </span>
                </li>
              }
            </ul>
          }
        </section>

        <p class="mt-6 text-ui-sm text-text-muted">
          RELAY no procesa pagos ni emite facturas: los estados de esta pantalla son los del
          proyecto de demostración.
        </p>
      }
    </div>
  `,
})
export class OrganizationCommissionsPage {
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  readonly organizationId = input.required<string>();

  protected readonly filter = signal<Filter>('all');

  protected readonly filters: readonly { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'approved', label: 'Por pagar' },
    { id: 'paid', label: 'Pagadas' },
    { id: 'closed', label: 'Anuladas' },
  ];

  protected readonly conversions = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.engagement.listConversions({ organizationId: params }),
    defaultValue: [],
  });

  private readonly affiliates = rxResource({
    stream: () => this.catalog.listAffiliates(),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) =>
      this.catalog.listCampaigns({ organizationId: params, pageSize: 50, includeAll: true }),
  });

  protected readonly summary = computed(() => totals(this.conversions.value()));

  protected readonly visible = computed(() => {
    const statuses = GROUPS[this.filter()];
    const items = this.conversions.value();

    return statuses.length ? items.filter((item) => statuses.includes(item.status)) : items;
  });

  protected readonly byAffiliate = computed(() => {
    const grouped = new Map<string, { pending: number; available: number; paid: number }>();

    for (const conversion of this.conversions.value()) {
      const current = grouped.get(conversion.affiliateId) ?? { pending: 0, available: 0, paid: 0 };

      if (conversion.status === 'paid') {
        current.paid += conversion.commission;
      } else if (conversion.status === 'approved' || conversion.status === 'scheduled') {
        current.available += conversion.commission;
      } else if (conversion.status === 'registered' || conversion.status === 'validating') {
        current.pending += conversion.commission;
      }

      grouped.set(conversion.affiliateId, current);
    }

    return [...grouped.entries()]
      .map(([affiliateId, values]) => ({ affiliateId, ...values }))
      .sort((a, b) => b.paid + b.available - (a.paid + a.available));
  });

  protected countFor(filter: Filter): number | null {
    const statuses = GROUPS[filter];
    const items = this.conversions.value();

    const count = statuses.length
      ? items.filter((item) => statuses.includes(item.status)).length
      : items.length;

    return count || null;
  }

  protected affiliateName(affiliateId: string): string {
    return (
      this.affiliates.value().find((affiliate) => affiliate.id === affiliateId)?.name ?? affiliateId
    );
  }

  protected campaignName(campaignId: string): string {
    return (
      (this.campaigns.value()?.items ?? []).find((campaign) => campaign.id === campaignId)?.name ??
      campaignId
    );
  }

  protected exportCsv(): void {
    const csv = toCsv(this.visible(), [
      { header: 'ID', value: (item) => item.id },
      { header: 'Afiliado', value: (item) => this.affiliateName(item.affiliateId) },
      { header: 'Campaña', value: (item) => this.campaignName(item.campaignId) },
      { header: 'Fecha', value: (item) => item.occurredAt },
      { header: 'Comisión', value: (item) => formatCurrency(item.commission) },
      { header: 'Estado', value: (item) => item.status },
    ]);

    downloadCsv(csvFilename('comisiones', DEMO_TODAY), csv);
    this.toasts.success(`${this.visible().length} comisiones exportadas`);
  }
}
