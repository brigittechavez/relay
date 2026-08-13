import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { ToastService } from '@ds/toast/toast.service';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { Conversion, ConversionStatus } from '@data/models/tracking';
import { channelLabel } from '@data/models/taxonomy';
import { totals } from '@data/logic/analytics';
import { DEMO_TODAY } from '@data/seed/demo-clock';
import { KpiCard } from '@domain/kpi/kpi-card';
import { ConversionStatusBadge } from '@domain/status/status-badges';
import { csvFilename, downloadCsv, toCsv } from '@shared/utils/csv';
import { formatCurrency } from '@shared/utils/format';
import { DatePipe, MoneyPipe, NumberPipe } from '@shared/pipes/format.pipes';

type Filter = 'pending' | 'approved' | 'paid' | 'all';

/** Acciones disponibles en cada estado del ciclo de validación. */
const NEXT_ACTIONS: Partial<
  Record<
    ConversionStatus,
    readonly { status: ConversionStatus; label: string; variant: 'primary' | 'danger' }[]
  >
> = {
  registered: [
    { status: 'validating', label: 'Poner en validación', variant: 'primary' },
    { status: 'rejected', label: 'Rechazar', variant: 'danger' },
  ],
  validating: [
    { status: 'approved', label: 'Aprobar', variant: 'primary' },
    { status: 'rejected', label: 'Rechazar', variant: 'danger' },
  ],
  approved: [
    { status: 'scheduled', label: 'Programar pago', variant: 'primary' },
    { status: 'refunded', label: 'Marcar reembolso', variant: 'danger' },
  ],
  scheduled: [
    { status: 'paid', label: 'Marcar pagada', variant: 'primary' },
    { status: 'refunded', label: 'Marcar reembolso', variant: 'danger' },
  ],
};

/**
 * Conversiones y su ciclo de validación.
 *
 * Ninguna comisión avanza sola: cada transición la provoca la organización
 * desde esta tabla, y el ciclo solo admite los pasos válidos. Rechazar o
 * reembolsar anula la comisión asociada.
 */
@Component({
  selector: 'rly-organization-conversions-page',
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
    NumberPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Conversiones</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Cada conversión pasa por validación antes de generar comisión.
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
        <rly-skeleton class="mt-6" shape="block" height="18rem" />
      } @else {
        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <rly-kpi-card label="Conversiones" [value]="summary().conversions | rlyNumber" />
          <rly-kpi-card label="Revenue atribuido" [value]="summary().revenue | rlyMoney" />
          <rly-kpi-card
            label="Por validar"
            [value]="pendingCount() | rlyNumber"
            inverted
            hint="Conversiones registradas o en validación que esperan tu decisión."
          />
          <rly-kpi-card
            label="Comisiones a pagar"
            [value]="summary().available | rlyMoney"
            inverted
          />
        </div>

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

        @if (!visible().length) {
          <div class="mt-6 rounded-lg border border-border bg-surface">
            <rly-empty-state
              icon="conversions"
              title="Ninguna conversión en este estado"
              description="Las conversiones aparecen aquí en cuanto un afiliado genera una."
            />
          </div>
        } @else {
          <!-- Tabla (escritorio) -->
          <div
            class="mt-4 hidden overflow-hidden rounded-lg border border-border bg-surface lg:block"
          >
            <table>
              <caption class="sr-only">
                Conversiones de la organización
              </caption>
              <thead>
                <tr class="border-b border-border">
                  <th scope="col" [class]="th">ID</th>
                  <th scope="col" [class]="th">Afiliado</th>
                  <th scope="col" [class]="th">Campaña</th>
                  <th scope="col" [class]="th">Fecha</th>
                  <th scope="col" [class]="thNumeric">Valor</th>
                  <th scope="col" [class]="thNumeric">Comisión</th>
                  <th scope="col" [class]="th">Estado</th>
                  <th scope="col" [class]="th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (conversion of visible(); track conversion.id) {
                  <tr class="border-b border-border last:border-b-0">
                    <td [class]="td + ' font-mono text-ui-sm text-text-muted'">
                      {{ conversion.id }}
                    </td>
                    <td [class]="td">{{ affiliateName(conversion.affiliateId) }}</td>
                    <td [class]="td">
                      <span class="block">{{ campaignName(conversion.campaignId) }}</span>
                      <span class="block text-ui-sm text-text-muted">
                        {{ channelName(conversion.channel) }}
                      </span>
                    </td>
                    <td [class]="td + ' text-text-secondary'">
                      {{ conversion.occurredAt | rlyDate }}
                    </td>
                    <td [class]="tdNumeric">{{ conversion.value | rlyMoney }}</td>
                    <td [class]="tdNumeric + ' font-medium'">
                      {{ conversion.commission | rlyMoney }}
                    </td>
                    <td [class]="td">
                      <rly-conversion-status [status]="conversion.status" />
                    </td>
                    <td [class]="td">
                      <div class="flex flex-wrap gap-1.5">
                        @for (action of actionsFor(conversion.status); track action.status) {
                          <button
                            rlyButton
                            [variant]="action.variant === 'danger' ? 'danger' : 'tertiary'"
                            size="sm"
                            type="button"
                            [disabled]="busy() === conversion.id"
                            (click)="transition(conversion, action.status)"
                          >
                            {{ action.label }}
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Tarjetas (móvil) -->
          <ul class="mt-4 flex flex-col gap-3 lg:hidden">
            @for (conversion of visible(); track conversion.id) {
              <li class="rounded-lg border border-border bg-surface p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-ui font-medium text-ink">
                      {{ campaignName(conversion.campaignId) }}
                    </p>
                    <p class="truncate text-ui-sm text-text-secondary">
                      {{ affiliateName(conversion.affiliateId) }} ·
                      {{ channelName(conversion.channel) }}
                    </p>
                  </div>
                  <rly-conversion-status [status]="conversion.status" />
                </div>

                <dl class="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <dt class="text-ui-sm text-text-muted">Fecha</dt>
                    <dd class="text-ui-sm text-ink">{{ conversion.occurredAt | rlyDate }}</dd>
                  </div>
                  <div>
                    <dt class="text-ui-sm text-text-muted">Valor</dt>
                    <dd class="text-ui tabular-nums text-ink">{{ conversion.value | rlyMoney }}</dd>
                  </div>
                  <div>
                    <dt class="text-ui-sm text-text-muted">Comisión</dt>
                    <dd class="text-ui font-medium tabular-nums text-ink">
                      {{ conversion.commission | rlyMoney }}
                    </dd>
                  </div>
                </dl>

                @if (actionsFor(conversion.status).length) {
                  <div class="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    @for (action of actionsFor(conversion.status); track action.status) {
                      <button
                        rlyButton
                        [variant]="action.variant === 'danger' ? 'danger' : 'tertiary'"
                        size="sm"
                        type="button"
                        [disabled]="busy() === conversion.id"
                        (click)="transition(conversion, action.status)"
                      >
                        {{ action.label }}
                      </button>
                    }
                  </div>
                }
              </li>
            }
          </ul>
        }

        <p class="mt-4 text-ui-sm text-text-muted">
          La atribución y el seguimiento son simulados en este proyecto. Las transiciones que haces
          aquí sí modifican el estado y los balances de la demo.
        </p>
      }
    </div>
  `,
})
export class OrganizationConversionsPage {
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  readonly organizationId = input.required<string>();
  readonly campaignId = input<string | undefined>(undefined);

  protected readonly filter = signal<Filter>('all');
  protected readonly busy = signal<string | null>(null);

  protected readonly th =
    'px-4 py-3 text-left text-ui-sm font-medium text-text-secondary whitespace-nowrap';
  protected readonly thNumeric = `${this.th} text-right`;
  protected readonly td = 'px-4 py-3 text-ui align-top text-ink';
  protected readonly tdNumeric = 'px-4 py-3 text-ui text-right tabular-nums text-ink align-top';

  protected readonly filters: readonly { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Por validar' },
    { id: 'approved', label: 'Aprobadas' },
    { id: 'paid', label: 'Pagadas' },
  ];

  protected readonly conversions = rxResource({
    params: () => ({ organizationId: this.organizationId(), campaignId: this.campaignId() }),
    stream: ({ params }) => this.engagement.listConversions(params),
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

  protected readonly pendingCount = computed(
    () =>
      this.conversions.value().filter((item) => ['registered', 'validating'].includes(item.status))
        .length,
  );

  protected readonly visible = computed(() => {
    const items = this.conversions.value();

    switch (this.filter()) {
      case 'pending':
        return items.filter((item) => ['registered', 'validating'].includes(item.status));
      case 'approved':
        return items.filter((item) => ['approved', 'scheduled'].includes(item.status));
      case 'paid':
        return items.filter((item) => item.status === 'paid');
      default:
        return items;
    }
  });

  protected countFor(filter: Filter): number | null {
    const items = this.conversions.value();

    const count = {
      all: items.length,
      pending: items.filter((item) => ['registered', 'validating'].includes(item.status)).length,
      approved: items.filter((item) => ['approved', 'scheduled'].includes(item.status)).length,
      paid: items.filter((item) => item.status === 'paid').length,
    }[filter];

    return count || null;
  }

  protected actionsFor(status: ConversionStatus) {
    return NEXT_ACTIONS[status] ?? [];
  }

  protected async transition(conversion: Conversion, status: ConversionStatus): Promise<void> {
    if (this.busy()) return;
    this.busy.set(conversion.id);

    try {
      await firstValueFrom(this.engagement.updateConversion(conversion.id, { status }));
      this.conversions.reload();
      this.toasts.success(`${conversion.id} actualizada`);
    } catch {
      this.toasts.error('No se pudo actualizar la conversión');
    } finally {
      this.busy.set(null);
    }
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

  protected channelName(channel: string): string {
    return channelLabel(channel as never);
  }

  protected exportCsv(): void {
    const csv = toCsv(this.visible(), [
      { header: 'ID', value: (item) => item.id },
      { header: 'Afiliado', value: (item) => this.affiliateName(item.affiliateId) },
      { header: 'Campaña', value: (item) => this.campaignName(item.campaignId) },
      { header: 'Canal', value: (item) => this.channelName(item.channel) },
      { header: 'Fecha', value: (item) => item.occurredAt },
      { header: 'Valor', value: (item) => formatCurrency(item.value) },
      { header: 'Comisión', value: (item) => formatCurrency(item.commission) },
      { header: 'Estado', value: (item) => item.status },
    ]);

    downloadCsv(csvFilename('conversiones', DEMO_TODAY), csv);
    this.toasts.success(`${this.visible().length} conversiones exportadas`);
  }
}
