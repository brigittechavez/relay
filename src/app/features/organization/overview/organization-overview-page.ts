import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { PENDING_REVIEW } from '@data/models/application';
import { dailySeries, delta, previousWindow, totals, withinDays } from '@data/logic/analytics';
import { PeriodId, PERIODS } from '@data/models/common';
import { AnalyticsCard } from '@domain/analytics-card/analytics-card';
import { TrendChart } from '@domain/chart/trend-chart';
import { KpiCard } from '@domain/kpi/kpi-card';
import { PeriodSelector, periodWindow } from '@domain/period/period-selector';
import { MatchScore } from '@domain/match-score/match-score';
import { ApplicationStatusBadge, CampaignStatusBadge } from '@domain/status/status-badges';
import { MoneyPipe, NumberPipe, RelativeDatePipe } from '@shared/pipes/format.pipes';

/**
 * Overview de la organización.
 *
 * Responde a cuatro preguntas: cuánto está entrando, quién lo está trayendo,
 * qué espera una decisión y qué campaña sostiene el resultado. La analítica
 * profunda vive dentro de cada campaña, no aquí.
 */
@Component({
  selector: 'rly-organization-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    EmptyState,
    Icon,
    Skeleton,
    AnalyticsCard,
    TrendChart,
    KpiCard,
    PeriodSelector,
    MatchScore,
    ApplicationStatusBadge,
    CampaignStatusBadge,
    MoneyPipe,
    NumberPipe,
    RelativeDatePipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">{{ organization.value()?.name ?? 'Overview' }}</h2>
          <p class="mt-1 text-ui text-text-secondary">{{ periodCaption() }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <rly-period-selector
            [selected]="period()"
            ariaLabel="Periodo del resumen"
            (selectedChange)="period.set($event)"
          />

          <a
            rlyButton
            variant="primary"
            [routerLink]="['/app/organization', organizationId(), 'campanas', 'nueva']"
          >
            <rly-icon name="plus" [size]="16" />
            Crear campaña
          </a>
        </div>
      </header>

      @if (loading()) {
        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="rounded-lg border border-border bg-surface p-5">
              <rly-skeleton width="50%" />
              <rly-skeleton class="mt-3" width="70%" height="2rem" />
            </div>
          }
        </div>
      } @else {
        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <rly-kpi-card
            label="Revenue atribuido"
            [value]="summary().revenue | rlyMoney"
            [delta]="revenueDelta()"
            [caption]="window().comparison"
            hint="Valor de las conversiones atribuidas a afiliados, antes de comisiones."
          />
          <rly-kpi-card
            label="Conversiones"
            [value]="summary().conversions | rlyNumber"
            [delta]="conversionsDelta()"
            [caption]="window().comparison"
          />
          <rly-kpi-card
            label="Afiliados activos"
            [value]="activeAffiliates() | rlyNumber"
            caption="Acumulado, no del periodo"
            hint="Afiliados con al menos una campaña activa contigo ahora mismo."
          />
          <rly-kpi-card
            label="Comisiones pendientes"
            [value]="pendingCommission() | rlyMoney"
            caption="Saldo actual"
            inverted
            hint="Comisiones aprobadas o programadas que todavía no se han pagado."
          />
        </div>
      }

      <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="flex min-w-0 flex-col gap-6">
          <rly-analytics-card
            title="¿Cómo evoluciona el revenue atribuido?"
            [description]="chartCaption()"
          >
            @defer (on viewport) {
              <rly-trend-chart
                [series]="series()"
                label="Revenue atribuido"
                format="money"
                ariaLabel="Revenue atribuido por día"
              />
            } @placeholder {
              <div class="h-60"></div>
            } @loading {
              <rly-skeleton shape="block" height="15rem" />
            }
          </rly-analytics-card>

          <!-- Campañas -->
          <section aria-labelledby="campanas">
            <div class="flex items-baseline justify-between gap-3">
              <div>
                <h3 id="campanas" class="text-title-xs text-ink">Campañas</h3>
                <!-- Las cifras por campaña son de toda su vida, no del periodo
                     elegido arriba: sin decirlo, no cuadran con los KPIs. -->
                <p class="mt-0.5 text-ui-sm text-text-muted">Cifras acumuladas por campaña</p>
              </div>
              <a
                [routerLink]="['/app/organization', organizationId(), 'campanas']"
                class="focus-ring rounded-xs text-ui-sm text-text-secondary hover:text-ink"
              >
                Ver todas
              </a>
            </div>

            @if (campaignRows().length) {
              <ul class="mt-4 flex flex-col gap-2">
                @for (row of campaignRows(); track row.campaign.id) {
                  <li>
                    <a
                      [routerLink]="[
                        '/app/organization',
                        organizationId(),
                        'campanas',
                        row.campaign.id,
                        'resumen',
                      ]"
                      class="focus-ring flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border
                             border-border bg-surface p-4 transition-colors duration-micro
                             hover:border-border-strong"
                    >
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-ui font-medium text-ink">
                          {{ row.campaign.name }}
                        </span>
                        <rly-campaign-status class="mt-1" [status]="row.campaign.status" />
                      </span>

                      <span class="text-right">
                        <span class="block text-ui-sm text-text-muted">Conversiones</span>
                        <span class="block text-ui tabular-nums text-ink">
                          {{ row.conversions | rlyNumber }}
                        </span>
                      </span>

                      <span class="text-right">
                        <span class="block text-ui-sm text-text-muted">Revenue</span>
                        <span class="block text-ui tabular-nums text-ink">
                          {{ row.revenue | rlyMoney }}
                        </span>
                      </span>

                      <rly-icon name="chevron-right" [size]="16" class="text-text-muted" />
                    </a>
                  </li>
                }
              </ul>
            } @else if (!loading()) {
              <div class="mt-4 rounded-lg border border-border bg-surface">
                <rly-empty-state
                  icon="campaigns"
                  title="Todavía no has publicado ninguna campaña"
                  description="Crea la primera y define qué conversión genera comisión."
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
            }
          </section>
        </div>

        <aside class="flex flex-col gap-6">
          <!-- Acciones pendientes -->
          <section
            class="rounded-lg border border-border bg-surface p-5"
            aria-labelledby="pendientes"
          >
            <h3 id="pendientes" class="text-title-xs text-ink">Requiere tu atención</h3>

            <ul class="mt-4 flex flex-col gap-3">
              <li>
                <a
                  [routerLink]="['/app/organization', organizationId(), 'aplicaciones']"
                  class="focus-ring flex items-center gap-3 rounded-sm"
                >
                  <span
                    class="grid size-9 shrink-0 place-items-center rounded-sm bg-surface-muted text-ink"
                    aria-hidden="true"
                  >
                    <rly-icon name="applications" [size]="16" />
                  </span>
                  <span class="min-w-0 flex-1 text-ui text-ink">Solicitudes por revisar</span>
                  <span class="text-title-xs tabular-nums text-ink">
                    {{ pendingApplications().length }}
                  </span>
                </a>
              </li>

              <li>
                <a
                  [routerLink]="['/app/organization', organizationId(), 'conversiones']"
                  class="focus-ring flex items-center gap-3 rounded-sm"
                >
                  <span
                    class="grid size-9 shrink-0 place-items-center rounded-sm bg-surface-muted text-ink"
                    aria-hidden="true"
                  >
                    <rly-icon name="hourglass" [size]="16" />
                  </span>
                  <span class="min-w-0 flex-1 text-ui text-ink">Conversiones por validar</span>
                  <span class="text-title-xs tabular-nums text-ink">
                    {{ pendingConversions().length }}
                  </span>
                </a>
              </li>
            </ul>
          </section>

          <!-- Solicitudes recientes -->
          @if (pendingApplications().length) {
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="solicitudes"
            >
              <div class="flex items-baseline justify-between gap-3">
                <h3 id="solicitudes" class="text-title-xs text-ink">Últimas solicitudes</h3>
                <a
                  [routerLink]="['/app/organization', organizationId(), 'aplicaciones']"
                  class="focus-ring rounded-xs text-ui-sm text-text-secondary hover:text-ink"
                >
                  Revisar
                </a>
              </div>

              <ul class="mt-4 flex flex-col gap-4">
                @for (application of pendingApplications().slice(0, 3); track application.id) {
                  <li class="flex items-start gap-3">
                    <rly-match-score
                      [value]="application.matchScore"
                      size="sm"
                      [showLabel]="false"
                    />

                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-ui text-ink">
                        {{ affiliateName(application.affiliateId) }}
                      </span>
                      <span class="block truncate text-ui-sm text-text-secondary">
                        {{ campaignName(application.campaignId) }}
                      </span>
                      <span class="mt-1.5 flex flex-wrap items-center gap-2">
                        <rly-application-status [status]="application.status" />
                        <span class="text-ui-sm text-text-muted">
                          {{ application.submittedAt | rlyRelativeDate }}
                        </span>
                      </span>
                    </span>
                  </li>
                }
              </ul>
            </section>
          }

          <!-- Top afiliados -->
          @if (topAffiliates().length) {
            <section class="rounded-lg border border-border bg-surface p-5" aria-labelledby="top">
              <h3 id="top" class="text-title-xs text-ink">Afiliados con más resultados</h3>

              <ol class="mt-4 flex flex-col gap-3">
                @for (row of topAffiliates(); track row.affiliateId; let index = $index) {
                  <li class="flex items-baseline gap-3">
                    <span class="w-4 shrink-0 text-ui-sm tabular-nums text-text-muted">
                      {{ index + 1 }}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-ui text-ink">
                      {{ affiliateName(row.affiliateId) }}
                    </span>
                    <span class="shrink-0 text-ui tabular-nums text-text-secondary">
                      {{ row.revenue | rlyMoney }}
                    </span>
                  </li>
                }
              </ol>
            </section>
          }
        </aside>
      </div>
    </div>
  `,
})
export class OrganizationOverviewPage {
  private readonly catalog = inject(CatalogRepository);
  private readonly engagement = inject(EngagementRepository);

  /** Periodo del resumen. Todo el panel se recalcula a partir de él. */
  protected readonly period = signal<PeriodId>('30d');

  protected readonly window = computed(() => periodWindow(this.period()));

  protected readonly periodCaption = computed(() => {
    const label = PERIODS.find((item) => item.id === this.period())?.label ?? '30 días';
    return `Resumen de ${label.toLowerCase()}`;
  });

  protected readonly chartCaption = computed(
    () =>
      `Valor de las conversiones por día · ${PERIODS.find((item) => item.id === this.period())?.label}`,
  );

  readonly organizationId = input.required<string>();

  protected readonly organization = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.catalog.organization(params),
  });

  private readonly conversions = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.engagement.listConversions({ organizationId: params }),
    defaultValue: [],
  });

  private readonly applications = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.engagement.listApplications({ organizationId: params }),
    defaultValue: [],
  });

  private readonly partnerships = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.engagement.listPartnerships({ organizationId: params }),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) =>
      this.catalog.listCampaigns({ organizationId: params, pageSize: 50, includeAll: true }),
  });

  private readonly affiliates = rxResource({
    stream: () => this.catalog.listAffiliates(),
    defaultValue: [],
  });

  protected readonly loading = computed(
    () => this.conversions.isLoading() || this.campaigns.isLoading(),
  );

  // --- Métricas -------------------------------------------------------------

  private readonly windowConversions = computed(() =>
    withinDays(this.conversions.value(), this.window().days, this.window().offset),
  );

  protected readonly summary = computed(() => totals(this.windowConversions()));

  private readonly previousSummary = computed(() =>
    totals(previousWindow(this.conversions.value(), this.window().days, this.window().offset)),
  );

  protected readonly revenueDelta = computed(() =>
    delta(this.summary().revenue, this.previousSummary().revenue),
  );

  protected readonly conversionsDelta = computed(() =>
    delta(this.summary().conversions, this.previousSummary().conversions),
  );

  protected readonly series = computed(() =>
    dailySeries(this.windowConversions(), this.window().days, 'value', this.window().offset),
  );

  protected readonly activeAffiliates = computed(
    () =>
      new Set(
        this.partnerships
          .value()
          .filter((partnership) => partnership.status === 'active')
          .map((partnership) => partnership.affiliateId),
      ).size,
  );

  /** Lo aprobado o programado pero aún no pagado: es lo que la empresa debe. */
  protected readonly pendingCommission = computed(() =>
    this.conversions
      .value()
      .filter((conversion) => ['approved', 'scheduled'].includes(conversion.status))
      .reduce((total, conversion) => total + conversion.commission, 0),
  );

  protected readonly pendingApplications = computed(() =>
    this.applications.value().filter((application) => PENDING_REVIEW.includes(application.status)),
  );

  protected readonly pendingConversions = computed(() =>
    this.conversions
      .value()
      .filter((conversion) => ['registered', 'validating'].includes(conversion.status)),
  );

  protected readonly campaignRows = computed(() => {
    const conversions = this.conversions.value();

    return (this.campaigns.value()?.items ?? [])
      .map((campaign) => {
        const stats = totals(
          conversions.filter((conversion) => conversion.campaignId === campaign.id),
        );
        return { campaign, conversions: stats.conversions, revenue: stats.revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  });

  protected readonly topAffiliates = computed(() => {
    const grouped = new Map<string, number>();

    for (const conversion of this.windowConversions()) {
      if (conversion.status === 'rejected' || conversion.status === 'refunded') continue;
      grouped.set(
        conversion.affiliateId,
        (grouped.get(conversion.affiliateId) ?? 0) + conversion.value,
      );
    }

    return [...grouped.entries()]
      .map(([affiliateId, revenue]) => ({ affiliateId, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  });

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
}
