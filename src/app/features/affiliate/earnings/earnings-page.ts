import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { totals } from '@data/logic/analytics';
import { DEMO_TODAY } from '@data/seed/demo-clock';
import { ConversionStatusBadge, PayoutStatusBadge } from '@domain/status/status-badges';
import { csvFilename, downloadCsv, toCsv } from '@shared/utils/csv';
import { formatCurrency } from '@shared/utils/format';
import { DatePipe, MoneyPipe, RelativeDatePipe } from '@shared/pipes/format.pipes';

/**
 * Ganancias.
 *
 * Tres balances y el detalle que los sostiene. No hay finanzas avanzadas: no
 * se emiten facturas, no se calculan impuestos y no se procesa ningún pago.
 * Los tres saldos salen del estado de cada conversión, así que siempre cuadran
 * con la tabla que hay debajo.
 */
@Component({
  selector: 'rly-earnings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    EmptyState,
    Icon,
    Skeleton,
    ConversionStatusBadge,
    PayoutStatusBadge,
    DatePipe,
    MoneyPipe,
    RelativeDatePipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Ganancias</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Comisiones generadas y estado de cada pago.
          </p>
        </div>

        <button
          rlyButton
          variant="tertiary"
          type="button"
          [disabled]="!conversions().length"
          (click)="exportCsv()"
        >
          <rly-icon name="download" [size]="16" />
          Exportar CSV
        </button>
      </header>

      @if (loading()) {
        <rly-skeleton class="mt-6" shape="block" height="18rem" />
      } @else {
        <!-- Balances -->
        <div
          class="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3"
        >
          <div class="bg-surface p-5">
            <p class="text-ui-sm text-text-secondary">Disponible</p>
            <p class="mt-2 text-kpi text-ink">{{ summary().available | rlyMoney }}</p>
            <p class="mt-1 text-ui-sm text-text-muted">Aprobado y a la espera de pago</p>
          </div>

          <div class="bg-surface p-5">
            <p class="text-ui-sm text-text-secondary">Pendiente</p>
            <p class="mt-2 text-kpi text-ink">{{ summary().pending | rlyMoney }}</p>
            <p class="mt-1 text-ui-sm text-text-muted">Conversiones aún en validación</p>
          </div>

          <div class="bg-surface p-5">
            <p class="text-ui-sm text-text-secondary">Pagado</p>
            <p class="mt-2 text-kpi text-ink">{{ summary().paid | rlyMoney }}</p>
            <p class="mt-1 text-ui-sm text-text-muted">Histórico total</p>
          </div>
        </div>

        <!-- Próximo pago -->
        @if (nextPayout(); as payout) {
          <div
            class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border
                   border-accent/50 bg-accent-soft p-5"
          >
            <div class="flex items-start gap-3">
              <rly-icon name="earnings" [size]="20" class="mt-0.5 text-ink" />
              <div>
                <p class="text-ui font-medium text-ink">
                  Próximo pago: {{ payout.amount | rlyMoney }}
                </p>
                <p class="mt-0.5 text-ui-sm text-text-secondary">
                  {{ payout.periodLabel }} · previsto {{ payout.expectedAt | rlyRelativeDate }}
                </p>
              </div>
            </div>

            <rly-payout-status [status]="payout.status" />
          </div>
        }

        <!-- Historial de pagos -->
        <section class="mt-8" aria-labelledby="pagos">
          <h3 id="pagos" class="text-title-xs text-ink">Pagos</h3>

          @if (payouts().length) {
            <ul class="mt-4 flex flex-col gap-2">
              @for (payout of payouts(); track payout.id) {
                <li
                  class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border
                         bg-surface p-4"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block text-ui font-medium text-ink">{{ payout.periodLabel }}</span>
                    <span class="block text-ui-sm text-text-secondary">
                      @if (payout.paidAt) {
                        Pagado el {{ payout.paidAt | rlyDate }}
                      } @else if (payout.expectedAt) {
                        Previsto para el {{ payout.expectedAt | rlyDate }}
                      }
                    </span>
                  </span>

                  <rly-payout-status [status]="payout.status" />

                  <span class="w-28 text-right text-ui font-medium tabular-nums text-ink">
                    {{ payout.amount | rlyMoney }}
                  </span>
                </li>
              }
            </ul>
          } @else {
            <p class="mt-3 text-ui text-text-secondary">Todavía no hay pagos registrados.</p>
          }
        </section>

        <!-- Comisiones -->
        <section class="mt-8" aria-labelledby="comisiones">
          <h3 id="comisiones" class="text-title-xs text-ink">Comisiones por conversión</h3>

          @if (conversions().length) {
            <ul class="mt-4 flex flex-col gap-2">
              @for (conversion of conversions(); track conversion.id) {
                <li
                  class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border
                         bg-surface p-4"
                >
                  <span class="w-24 shrink-0 font-mono text-ui-sm text-text-muted">
                    {{ conversion.id }}
                  </span>

                  <span class="min-w-0 flex-1">
                    <a
                      [routerLink]="['/app/affiliate/campanas', conversion.campaignId]"
                      class="focus-ring block truncate rounded-xs text-ui text-ink hover:underline"
                    >
                      {{ campaignName(conversion.campaignId) }}
                    </a>
                    <span class="block text-ui-sm text-text-secondary">
                      {{ conversion.occurredAt | rlyDate }}
                    </span>
                  </span>

                  <rly-conversion-status [status]="conversion.status" />

                  <span class="w-24 text-right text-ui tabular-nums text-ink">
                    {{ conversion.commission | rlyMoney }}
                  </span>
                </li>
              }
            </ul>
          } @else {
            <div class="mt-4 rounded-lg border border-border bg-surface">
              <rly-empty-state
                icon="commissions"
                title="Todavía no tienes comisiones"
                description="Cuando una conversión se registre en alguna de tus campañas, aparecerá aquí con su estado."
              >
                <a rlyButton variant="primary" routerLink="/app/affiliate/marketplace">
                  Explorar campañas
                </a>
              </rly-empty-state>
            </div>
          }
        </section>

        <p class="mt-6 text-ui-sm text-text-muted">
          Los pagos de este proyecto son simulados: RELAY no integra pasarela de pago, no emite
          facturas y no calcula impuestos.
        </p>
      }
    </div>
  `,
})
export class EarningsPage {
  private readonly session = inject(SessionStore);
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  private readonly affiliateId = computed(() => this.session.affiliate()?.id ?? null);

  private readonly conversionList = rxResource({
    params: () => this.affiliateId(),
    stream: ({ params }) => this.engagement.listConversions({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly payoutList = rxResource({
    params: () => this.affiliateId(),
    stream: ({ params }) => this.engagement.listPayouts({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    stream: () => this.catalog.listCampaigns({ pageSize: 50, includeAll: true }),
  });

  protected readonly loading = computed(() => this.conversionList.isLoading());
  protected readonly conversions = computed(() => this.conversionList.value());
  protected readonly payouts = computed(() => this.payoutList.value());

  protected readonly summary = computed(() => totals(this.conversions()));

  protected readonly nextPayout = computed(
    () =>
      this.payouts().find(
        (payout) => payout.status === 'scheduled' || payout.status === 'approved',
      ) ?? null,
  );

  protected campaignName(campaignId: string): string {
    return (
      (this.campaigns.value()?.items ?? []).find((campaign) => campaign.id === campaignId)?.name ??
      campaignId
    );
  }

  protected exportCsv(): void {
    const csv = toCsv(this.conversions(), [
      { header: 'ID', value: (conversion) => conversion.id },
      { header: 'Campaña', value: (conversion) => this.campaignName(conversion.campaignId) },
      { header: 'Fecha', value: (conversion) => conversion.occurredAt },
      { header: 'Valor', value: (conversion) => formatCurrency(conversion.value) },
      { header: 'Comisión', value: (conversion) => formatCurrency(conversion.commission) },
      { header: 'Estado', value: (conversion) => conversion.status },
    ]);

    downloadCsv(csvFilename('comisiones', DEMO_TODAY), csv);
    this.toasts.success(`${this.conversions().length} comisiones exportadas`);
  }
}
