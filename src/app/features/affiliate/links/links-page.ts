import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { ReferralLink } from '@data/models/tracking';
import { channelLabel } from '@data/models/taxonomy';
import { breakdownByChannel, conversionRate } from '@data/logic/analytics';
import { DEMO_TODAY } from '@data/seed/demo-clock';
import { AnalyticsCard } from '@domain/analytics-card/analytics-card';
import { KpiCard } from '@domain/kpi/kpi-card';
import { copyToClipboard } from '@shared/utils/clipboard';
import { csvFilename, downloadCsv, toCsv } from '@shared/utils/csv';
import { formatCurrency, formatPercent } from '@shared/utils/format';
import { MoneyPipe, NumberPipe, PercentPipe, RelativeDatePipe } from '@shared/pipes/format.pipes';

/**
 * Links y seguimiento, en todas las campañas.
 *
 * Es la única vista del área de afiliado que usa tabla de verdad: hay seis
 * columnas que se comparan entre sí y esa comparación es el propósito de la
 * pantalla. En móvil la tabla se convierte en tarjetas para no obligar a
 * desplazarse en horizontal.
 */
@Component({
  selector: 'rly-links-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Badge,
    Button,
    Chip,
    EmptyState,
    Icon,
    Skeleton,
    AnalyticsCard,
    KpiCard,
    MoneyPipe,
    NumberPipe,
    PercentPipe,
    RelativeDatePipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Links y seguimiento</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Rendimiento de todos tus links, en todas tus campañas.
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

      @if (loading()) {
        <rly-skeleton class="mt-6" shape="block" height="20rem" />
      } @else if (!links().length) {
        <div class="mt-6 rounded-lg border border-border bg-surface">
          <rly-empty-state
            icon="link"
            title="Todavía no tienes links"
            description="Los links se crean desde el espacio de cada campaña en la que participas."
          >
            <a rlyButton variant="primary" routerLink="/app/affiliate/campanas">
              Ver mis campañas
            </a>
          </rly-empty-state>
        </div>
      } @else {
        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <rly-kpi-card label="Links activos" [value]="activeCount() | rlyNumber" />
          <rly-kpi-card label="Clics" [value]="totalClicks() | rlyNumber" />
          <rly-kpi-card label="Conversiones" [value]="totalConversions() | rlyNumber" />
          <rly-kpi-card label="Comisión generada" [value]="totalCommission() | rlyMoney" />
        </div>

        <!-- Rendimiento por canal -->
        <rly-analytics-card
          class="mt-6"
          title="¿Qué canal te funciona mejor?"
          description="Acumulado de todos tus links, agrupado por canal."
        >
          <ul class="flex flex-col gap-4">
            @for (row of channels(); track row.channel) {
              <li>
                <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span class="text-ui text-ink">{{ channelName(row.channel) }}</span>
                  <span class="text-ui-sm text-text-secondary">
                    <span class="tabular-nums">{{ row.clicks | rlyNumber }}</span> clics ·
                    <span class="tabular-nums">{{ row.conversions }}</span> conversiones ·
                    <span class="font-medium tabular-nums text-ink">
                      {{ row.commission | rlyMoney }}
                    </span>
                  </span>
                </div>

                <div class="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    class="h-full rounded-full bg-accent transition-[width] duration-reveal"
                    [style.width.%]="share(row.commission)"
                  ></div>
                </div>
              </li>
            }
          </ul>

          @if (bestChannel(); as best) {
            <p class="mt-5 flex items-start gap-2 text-ui-sm text-text-secondary">
              <rly-icon name="trending-up" [size]="15" class="mt-0.5 text-success" />
              <span>
                {{ channelName(best.channel) }} convierte al
                {{ best.conversionRate | rlyPercent: 2 }}, tu mejor tasa entre canales.
              </span>
            </p>
          }
        </rly-analytics-card>

        <!-- Filtros -->
        <div class="scrollbar-none -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <rly-chip [selected]="filter() === 'all'" (toggled)="filter.set('all')"> Todos </rly-chip>
          <rly-chip [selected]="filter() === 'active'" (toggled)="filter.set('active')">
            Activos
          </rly-chip>
          <rly-chip [selected]="filter() === 'inactive'" (toggled)="filter.set('inactive')">
            Inactivos
          </rly-chip>
        </div>

        <!-- Tabla (escritorio) -->
        <div
          class="mt-4 hidden overflow-hidden rounded-lg border border-border bg-surface lg:block"
        >
          <table>
            <caption class="sr-only">
              Rendimiento por link
            </caption>
            <thead>
              <tr class="border-b border-border">
                <th scope="col" [class]="th">Link</th>
                <th scope="col" [class]="th">Campaña</th>
                <th scope="col" [class]="thNumeric">Clics</th>
                <th scope="col" [class]="thNumeric">Conversiones</th>
                <th scope="col" [class]="thNumeric">CVR</th>
                <th scope="col" [class]="thNumeric">Comisión</th>
                <th scope="col" class="w-12"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @for (link of visible(); track link.id) {
                <tr class="border-b border-border last:border-b-0">
                  <td [class]="td">
                    <span class="flex items-center gap-2">
                      <span class="font-medium text-ink">{{ link.name }}</span>
                      @if (!link.active) {
                        <rly-badge tone="neutral">Inactivo</rly-badge>
                      }
                    </span>
                    <span class="mt-0.5 block text-ui-sm text-text-muted">
                      {{ channelName(link.channel) }} · {{ link.createdAt | rlyRelativeDate }}
                    </span>
                  </td>
                  <td [class]="td">
                    <a
                      [routerLink]="['/app/affiliate/campanas', link.campaignId]"
                      class="focus-ring rounded-xs text-text-secondary hover:text-ink"
                    >
                      {{ campaignName(link.campaignId) }}
                    </a>
                  </td>
                  <td [class]="tdNumeric">{{ link.clicks | rlyNumber }}</td>
                  <td [class]="tdNumeric">{{ link.conversions }}</td>
                  <td [class]="tdNumeric">{{ rate(link) | rlyPercent: 2 }}</td>
                  <td [class]="tdNumeric + ' font-medium'">{{ link.commission | rlyMoney }}</td>
                  <td class="px-3 py-3 text-right">
                    <button
                      rlyButton
                      variant="ghost"
                      size="sm"
                      iconOnly
                      type="button"
                      [attr.aria-label]="'Copiar link ' + link.name"
                      (click)="copy(link)"
                    >
                      <rly-icon name="copy" [size]="16" />
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Tarjetas (móvil) -->
        <ul class="mt-4 flex flex-col gap-3 lg:hidden">
          @for (link of visible(); track link.id) {
            <li class="rounded-lg border border-border bg-surface p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="flex items-center gap-2 text-ui font-medium text-ink">
                    {{ link.name }}
                    @if (!link.active) {
                      <rly-badge tone="neutral">Inactivo</rly-badge>
                    }
                  </p>
                  <p class="mt-0.5 text-ui-sm text-text-secondary">
                    {{ campaignName(link.campaignId) }} · {{ channelName(link.channel) }}
                  </p>
                </div>

                <button
                  rlyButton
                  variant="tertiary"
                  size="sm"
                  iconOnly
                  type="button"
                  [attr.aria-label]="'Copiar link ' + link.name"
                  (click)="copy(link)"
                >
                  <rly-icon name="copy" [size]="16" />
                </button>
              </div>

              <dl class="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt class="text-ui-sm text-text-muted">Clics</dt>
                  <dd class="text-ui tabular-nums text-ink">{{ link.clicks | rlyNumber }}</dd>
                </div>
                <div>
                  <dt class="text-ui-sm text-text-muted">Conversiones</dt>
                  <dd class="text-ui tabular-nums text-ink">{{ link.conversions }}</dd>
                </div>
                <div>
                  <dt class="text-ui-sm text-text-muted">CVR</dt>
                  <dd class="text-ui tabular-nums text-ink">{{ rate(link) | rlyPercent: 2 }}</dd>
                </div>
                <div>
                  <dt class="text-ui-sm text-text-muted">Comisión</dt>
                  <dd class="text-ui font-medium tabular-nums text-ink">
                    {{ link.commission | rlyMoney }}
                  </dd>
                </div>
              </dl>
            </li>
          }
        </ul>

        <p class="mt-4 text-ui-sm text-text-muted">
          Los enlaces no redirigen: el seguimiento es simulado.
        </p>
      }
    </div>
  `,
})
export class LinksPage {
  private readonly session = inject(SessionStore);
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  protected readonly filter = signal<'all' | 'active' | 'inactive'>('all');

  protected readonly th =
    'px-4 py-3 text-left text-ui-sm font-medium text-text-secondary whitespace-nowrap';
  protected readonly thNumeric = `${this.th} text-right`;
  protected readonly td = 'px-4 py-3 text-ui align-top';
  protected readonly tdNumeric = 'px-4 py-3 text-ui text-right tabular-nums text-ink align-top';

  private readonly linkList = rxResource({
    params: () => this.session.affiliate()?.id,
    stream: ({ params }) => this.engagement.listLinks({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    stream: () => this.catalog.listCampaigns({ pageSize: 50, includeAll: true }),
  });

  protected readonly loading = computed(() => this.linkList.isLoading());
  protected readonly links = computed(() => this.linkList.value());

  protected readonly visible = computed(() => {
    const filter = this.filter();
    if (filter === 'all') return this.links();
    return this.links().filter((link) => (filter === 'active' ? link.active : !link.active));
  });

  protected readonly activeCount = computed(
    () => this.links().filter((link) => link.active).length,
  );

  protected readonly totalClicks = computed(() =>
    this.links().reduce((total, link) => total + link.clicks, 0),
  );

  protected readonly totalConversions = computed(() =>
    this.links().reduce((total, link) => total + link.conversions, 0),
  );

  protected readonly totalCommission = computed(() =>
    this.links().reduce((total, link) => total + link.commission, 0),
  );

  protected readonly channels = computed(() => breakdownByChannel(this.links()));

  protected readonly bestChannel = computed(
    () => [...this.channels()].sort((a, b) => b.conversionRate - a.conversionRate)[0] ?? null,
  );

  protected share(commission: number): number {
    const max = Math.max(...this.channels().map((row) => row.commission), 1);
    return (commission / max) * 100;
  }

  protected rate(link: ReferralLink): number {
    return conversionRate(link.conversions, link.clicks);
  }

  protected channelName(channel: string): string {
    return channelLabel(channel as never);
  }

  protected campaignName(campaignId: string): string {
    return (
      (this.campaigns.value()?.items ?? []).find((campaign) => campaign.id === campaignId)?.name ??
      campaignId
    );
  }

  protected async copy(link: ReferralLink): Promise<void> {
    const copied = await copyToClipboard(`https://rly.pe/${link.slug}`);
    this.toasts[copied ? 'success' : 'error'](
      copied ? 'Link copiado al portapapeles' : 'No se pudo copiar al portapapeles',
    );
  }

  /** Exporta lo que hay en pantalla, con el filtro aplicado. */
  protected exportCsv(): void {
    const csv = toCsv(this.visible(), [
      { header: 'Link', value: (link) => link.name },
      { header: 'Campaña', value: (link) => this.campaignName(link.campaignId) },
      { header: 'Canal', value: (link) => this.channelName(link.channel) },
      { header: 'Estado', value: (link) => (link.active ? 'Activo' : 'Inactivo') },
      { header: 'Clics', value: (link) => link.clicks },
      { header: 'Conversiones', value: (link) => link.conversions },
      { header: 'CVR', value: (link) => formatPercent(this.rate(link), 2) },
      { header: 'Comisión', value: (link) => formatCurrency(link.commission) },
      { header: 'Creado', value: (link) => link.createdAt },
    ]);

    downloadCsv(csvFilename('links', DEMO_TODAY), csv);
    this.toasts.success(`${this.visible().length} links exportados`);
  }
}
