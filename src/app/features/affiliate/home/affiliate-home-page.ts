import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { SessionStore } from '@core/session/session.store';
import { SavedStore } from '@core/session/saved.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { Campaign } from '@data/models/campaign';
import {
  conversionRate,
  dailySeries,
  delta,
  previousWindow,
  totals,
  withinDays,
} from '@data/logic/analytics';
import { PeriodId, PERIODS } from '@data/models/common';
import { computeMatchScore, evaluateEligibility } from '@data/logic/matching';
import { AnalyticsCard } from '@domain/analytics-card/analytics-card';
import { CampaignCard } from '@domain/campaign-card/campaign-card';
import { TrendChart } from '@domain/chart/trend-chart';
import { KpiCard } from '@domain/kpi/kpi-card';
import { PeriodSelector, periodWindow } from '@domain/period/period-selector';
import { RelayScore } from '@domain/relay-score/relay-score';
import { ApplicationStatusBadge } from '@domain/status/status-badges';
import {
  CompactPipe,
  MoneyPipe,
  NumberPipe,
  PercentPipe,
  RelativeDatePipe,
} from '@shared/pipes/format.pipes';

/**
 * Inicio del afiliado.
 *
 * Command center deliberadamente corto: cuatro KPIs, la evolución, lo que está
 * en marcha y lo que requiere una decisión. Todo lo que se muestra sale de los
 * registros de conversión, así que el panel y las tablas nunca se contradicen.
 */
@Component({
  selector: 'rly-affiliate-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Badge,
    Button,
    EmptyState,
    Icon,
    Skeleton,
    AnalyticsCard,
    CampaignCard,
    TrendChart,
    KpiCard,
    PeriodSelector,
    RelayScore,
    ApplicationStatusBadge,
    CompactPipe,
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
          <h2 class="text-title-md text-ink">Hola, {{ firstName() }}</h2>
          <p class="mt-1 text-ui text-text-secondary">{{ periodCaption() }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <rly-period-selector
            [selected]="period()"
            ariaLabel="Periodo del resumen"
            (selectedChange)="period.set($event)"
          />

          <a rlyButton variant="primary" routerLink="/app/affiliate/marketplace">
            <rly-icon name="marketplace" [size]="16" />
            Buscar campañas
          </a>
        </div>
      </header>

      <!-- KPIs -->
      @if (loading()) {
        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="rounded-lg border border-border bg-surface p-5">
              <rly-skeleton width="50%" />
              <rly-skeleton class="mt-3" width="70%" height="2rem" />
              <rly-skeleton class="mt-3" width="40%" />
            </div>
          }
        </div>
      } @else {
        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <rly-kpi-card
            label="Comisiones generadas"
            [value]="summary().commission | rlyMoney"
            [delta]="commissionDelta()"
            [caption]="window().comparison"
            hint="Suma de las comisiones de las conversiones que no se han rechazado ni reembolsado."
          />
          <rly-kpi-card
            label="Conversiones"
            [value]="summary().conversions | rlyNumber"
            [delta]="conversionsDelta()"
            [caption]="window().comparison"
          />
          <rly-kpi-card
            label="Clics"
            [value]="clicks() | rlyNumber"
            caption="Acumulado de tus links"
            hint="Suma de todos tus links activos, sin recortar por periodo."
          />
          <rly-kpi-card
            label="Tasa de conversión"
            [value]="conversionRateValue() | rlyPercent: 2"
            caption="Acumulado de tus links"
            hint="Conversiones del periodo entre los clics acumulados de tus links."
          />
        </div>
      }

      <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="flex min-w-0 flex-col gap-6">
          <!-- Evolución -->
          <rly-analytics-card
            title="¿Cómo evolucionan mis comisiones?"
            [description]="chartCaption()"
          >
            @defer (on viewport) {
              <rly-trend-chart
                [series]="series()"
                label="Comisiones"
                format="money"
                ariaLabel="Comisiones generadas por día"
              />
            } @placeholder {
              <div class="h-60"></div>
            } @loading {
              <rly-skeleton shape="block" height="15rem" />
            }
          </rly-analytics-card>

          <!-- Campañas activas -->
          <section aria-labelledby="activas">
            <div class="flex items-baseline justify-between gap-3">
              <h3 id="activas" class="text-title-xs text-ink">Campañas activas</h3>
              <a
                routerLink="/app/affiliate/campanas"
                class="focus-ring rounded-xs text-ui-sm text-text-secondary hover:text-ink"
              >
                Ver todas
              </a>
            </div>

            @if (activeCampaigns().length) {
              <ul class="mt-4 flex flex-col gap-2">
                @for (item of activeCampaigns(); track item.campaign.id) {
                  <li>
                    <a
                      [routerLink]="['/app/affiliate/campanas', item.campaign.id]"
                      class="focus-ring flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border
                             border-border bg-surface p-4 transition-colors duration-micro
                             hover:border-border-strong"
                    >
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-ui font-medium text-ink">
                          {{ item.campaign.name }}
                        </span>
                        <span class="block truncate text-ui-sm text-text-secondary">
                          {{ organizationName(item.campaign) }}
                        </span>
                      </span>

                      <span class="text-right">
                        <span class="block text-ui-sm text-text-muted">Conversiones</span>
                        <span class="block text-ui tabular-nums text-ink">
                          {{ item.conversions | rlyNumber }}
                        </span>
                      </span>

                      <span class="text-right">
                        <span class="block text-ui-sm text-text-muted">Comisión</span>
                        <span class="block text-ui tabular-nums text-ink">
                          {{ item.commission | rlyMoney }}
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
                  title="Todavía no estás en ninguna campaña"
                  description="Cuando una organización apruebe tu solicitud, la campaña aparecerá aquí."
                >
                  <a rlyButton variant="primary" routerLink="/app/affiliate/marketplace">
                    Explorar el marketplace
                  </a>
                </rly-empty-state>
              </div>
            }
          </section>

          <!-- Oportunidades recomendadas -->
          @if (recommendations().length) {
            <section aria-labelledby="oportunidades">
              <div class="flex items-baseline justify-between gap-3">
                <h3 id="oportunidades" class="text-title-xs text-ink">Oportunidades para ti</h3>
                <a
                  routerLink="/app/affiliate/marketplace"
                  class="focus-ring rounded-xs text-ui-sm text-text-secondary hover:text-ink"
                >
                  Ver marketplace
                </a>
              </div>

              <ul class="mt-4 flex flex-col gap-3">
                @for (campaign of recommendations(); track campaign.id) {
                  <li>
                    <rly-campaign-card
                      variant="horizontal"
                      [campaign]="campaign"
                      [organization]="organizationFor(campaign)"
                      [matchScore]="matchFor(campaign)"
                      relation="eligible"
                      [saved]="saved.isCampaignSaved(campaign.id)"
                      (saveToggled)="saved.toggleCampaign(campaign.id)"
                    />
                  </li>
                }
              </ul>
            </section>
          }
        </div>

        <!-- Columna lateral -->
        <aside class="flex flex-col gap-6">
          <!-- Solicitudes pendientes -->
          <section
            class="rounded-lg border border-border bg-surface p-5"
            aria-labelledby="solicitudes"
          >
            <div class="flex items-baseline justify-between gap-3">
              <h3 id="solicitudes" class="text-title-xs text-ink">Solicitudes</h3>
              <a
                routerLink="/app/affiliate/aplicaciones"
                class="focus-ring rounded-xs text-ui-sm text-text-secondary hover:text-ink"
              >
                Ver todas
              </a>
            </div>

            @if (pendingApplications().length) {
              <ul class="mt-4 flex flex-col gap-3">
                @for (application of pendingApplications(); track application.id) {
                  <li>
                    <a
                      [routerLink]="['/app/affiliate/aplicaciones', application.id]"
                      class="focus-ring block rounded-sm"
                    >
                      <span class="block truncate text-ui text-ink">
                        {{ campaignName(application.campaignId) }}
                      </span>
                      <span class="mt-1.5 flex items-center gap-2">
                        <rly-application-status [status]="application.status" />
                        <span class="text-ui-sm text-text-muted">
                          {{ application.submittedAt | rlyRelativeDate }}
                        </span>
                      </span>
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <p class="mt-3 text-ui text-text-secondary">
                No tienes solicitudes esperando respuesta.
              </p>
            }
          </section>

          <!-- Relay Score -->
          @if (affiliate(); as person) {
            <section class="rounded-lg border border-border bg-surface p-5" aria-labelledby="score">
              <div class="flex items-baseline justify-between gap-3">
                <h3 id="score" class="text-title-xs text-ink">Relay Score</h3>
                <a
                  routerLink="/app/affiliate/perfil"
                  class="focus-ring rounded-xs text-ui-sm text-text-secondary hover:text-ink"
                >
                  Mejorar
                </a>
              </div>

              <rly-relay-score class="mt-4" [affiliate]="person" [showBreakdown]="false" />

              <div class="mt-5 border-t border-border pt-4">
                <div class="flex items-baseline justify-between gap-3">
                  <p class="text-ui-sm text-text-secondary">Perfil completo</p>
                  <p class="text-ui font-medium tabular-nums text-ink">
                    {{ person.profileCompleteness | rlyPercent: 0 }}
                  </p>
                </div>
                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    class="h-full rounded-full bg-ink"
                    [style.width.%]="person.profileCompleteness"
                  ></div>
                </div>
              </div>
            </section>
          }

          <!-- Próximo pago -->
          @if (nextPayout(); as payout) {
            <section class="rounded-lg border border-border bg-surface p-5" aria-labelledby="pago">
              <h3 id="pago" class="text-title-xs text-ink">Próximo pago</h3>
              <p class="mt-3 text-title-sm tabular-nums text-ink">{{ payout.amount | rlyMoney }}</p>
              <p class="mt-1 text-ui-sm text-text-secondary">
                {{ payout.periodLabel }} · {{ payout.expectedAt | rlyRelativeDate }}
              </p>

              <a
                rlyButton
                variant="tertiary"
                size="sm"
                block
                class="mt-4"
                routerLink="/app/affiliate/ganancias"
              >
                Ver ganancias
              </a>
            </section>
          }

          <!-- Audiencia -->
          @if (affiliate(); as person) {
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="canales"
            >
              <h3 id="canales" class="text-title-xs text-ink">Tus canales</h3>
              <ul class="mt-3 flex flex-col gap-2.5">
                @for (channel of person.channels; track channel.id) {
                  <li class="flex items-baseline justify-between gap-3">
                    <span class="text-ui text-text-secondary">{{ channel.handle }}</span>
                    <span class="text-ui tabular-nums text-ink">
                      {{ channel.audience | rlyCompact }}
                    </span>
                  </li>
                }
              </ul>

              @if (!person.channels.length) {
                <p class="mt-3 text-ui-sm text-text-secondary">
                  Añade tus canales para mejorar tu compatibilidad con las campañas.
                </p>
                <rly-badge tone="warning" class="mt-3">Perfil incompleto</rly-badge>
              }
            </section>
          }
        </aside>
      </div>
    </div>
  `,
})
export class AffiliateHomePage {
  private readonly session = inject(SessionStore);
  private readonly catalog = inject(CatalogRepository);
  private readonly engagement = inject(EngagementRepository);

  protected readonly saved = inject(SavedStore);
  protected readonly affiliate = this.session.affiliate;

  /** Periodo del resumen. Todo el panel se recalcula a partir de él. */
  protected readonly period = signal<PeriodId>('30d');

  protected readonly window = computed(() => periodWindow(this.period()));

  protected readonly chartCaption = computed(
    () => `Comisión generada por día · ${PERIODS.find((item) => item.id === this.period())?.label}`,
  );

  protected readonly periodCaption = computed(() => {
    const label = PERIODS.find((item) => item.id === this.period())?.label ?? '30 días';
    return `Resumen de ${label.toLowerCase()}`;
  });

  protected readonly firstName = computed(() => this.affiliate()?.name.split(' ')[0] ?? 'de nuevo');

  private readonly affiliateId = computed(() => this.affiliate()?.id ?? null);

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

  private readonly partnerships = rxResource({
    params: () => this.affiliateId(),
    stream: ({ params }) => this.engagement.listPartnerships({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly applications = rxResource({
    params: () => this.affiliateId(),
    stream: ({ params }) => this.engagement.listApplications({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly payouts = rxResource({
    params: () => this.affiliateId(),
    stream: ({ params }) => this.engagement.listPayouts({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    stream: () => this.catalog.listCampaigns({ pageSize: 50 }),
  });

  private readonly organizations = rxResource({
    stream: () => this.catalog.listOrganizations(),
    defaultValue: [],
  });

  protected readonly loading = computed(
    () => this.conversions.isLoading() || this.links.isLoading(),
  );

  // --- Métricas -------------------------------------------------------------

  private readonly windowConversions = computed(() =>
    withinDays(this.conversions.value(), this.window().days, this.window().offset),
  );

  protected readonly summary = computed(() => totals(this.windowConversions()));

  private readonly previousSummary = computed(() =>
    totals(previousWindow(this.conversions.value(), this.window().days, this.window().offset)),
  );

  protected readonly commissionDelta = computed(() =>
    delta(this.summary().commission, this.previousSummary().commission),
  );

  protected readonly conversionsDelta = computed(() =>
    delta(this.summary().conversions, this.previousSummary().conversions),
  );

  protected readonly clicks = computed(() =>
    this.links.value().reduce((total, link) => total + link.clicks, 0),
  );

  protected readonly conversionRateValue = computed(() =>
    conversionRate(this.summary().conversions, this.clicks()),
  );

  protected readonly series = computed(() =>
    dailySeries(this.windowConversions(), this.window().days, 'commission', this.window().offset),
  );

  // --- Listas ---------------------------------------------------------------

  /** Campañas en marcha, con sus cifras acumuladas. */
  protected readonly activeCampaigns = computed(() => {
    const byId = new Map(this.campaignList().map((campaign) => [campaign.id, campaign]));

    return this.partnerships
      .value()
      .filter((partnership) => partnership.status === 'active')
      .map((partnership) => {
        const campaign = byId.get(partnership.campaignId);
        const conversions = this.conversions
          .value()
          .filter((conversion) => conversion.campaignId === partnership.campaignId);
        const stats = totals(conversions);

        return campaign
          ? { campaign, conversions: stats.conversions, commission: stats.commission }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.commission - a.commission);
  });

  protected readonly pendingApplications = computed(() =>
    this.applications
      .value()
      .filter((application) =>
        ['submitted', 'under-review', 'info-requested'].includes(application.status),
      )
      .slice(0, 4),
  );

  protected readonly nextPayout = computed(
    () =>
      this.payouts
        .value()
        .find((payout) => payout.status === 'scheduled' || payout.status === 'approved') ?? null,
  );

  private readonly campaignList = computed<readonly Campaign[]>(
    () => this.campaigns.value()?.items ?? [],
  );

  /**
   * Oportunidades sugeridas: campañas para las que califica y en las que
   * todavía no participa ni ha solicitado, por compatibilidad descendente.
   */
  protected readonly recommendations = computed(() => {
    const affiliate = this.affiliate();
    if (!affiliate) return [];

    const engaged = new Set([
      ...this.partnerships.value().map((partnership) => partnership.campaignId),
      ...this.applications.value().map((application) => application.campaignId),
    ]);

    return this.campaignList()
      .filter((campaign) => !engaged.has(campaign.id))
      .filter((campaign) => evaluateEligibility(affiliate, campaign).eligible)
      .map((campaign) => ({ campaign, score: computeMatchScore(affiliate, campaign) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((entry) => entry.campaign);
  });

  protected matchFor(campaign: Campaign): number | null {
    const affiliate = this.affiliate();
    return affiliate ? computeMatchScore(affiliate, campaign) : null;
  }

  protected organizationFor(campaign: Campaign) {
    return this.organizations.value().find((item) => item.id === campaign.organizationId) ?? null;
  }

  protected organizationName(campaign: Campaign): string {
    return this.organizationFor(campaign)?.name ?? '';
  }

  protected campaignName(campaignId: string): string {
    return this.campaignList().find((campaign) => campaign.id === campaignId)?.name ?? campaignId;
  }
}
