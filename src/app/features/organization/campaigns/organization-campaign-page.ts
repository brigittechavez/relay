import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Modal } from '@ds/modal/modal';
import { Skeleton } from '@ds/skeleton/skeleton';
import { TabNav } from '@ds/tabs/tabs';
import { ToastService } from '@ds/toast/toast.service';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { PENDING_REVIEW } from '@data/models/application';
import { CampaignStatus, CONVERSION_EVENT_LABELS } from '@data/models/campaign';
import { conversionRate, dailySeries, funnel, totals, withinDays } from '@data/logic/analytics';
import { commissionDetail } from '@data/logic/commission';
import { AnalyticsCard } from '@domain/analytics-card/analytics-card';
import { TrendChart } from '@domain/chart/trend-chart';
import { GoalProgress } from '@domain/goal-progress/goal-progress';
import { KpiCard } from '@domain/kpi/kpi-card';
import { AccessBadge, CampaignStatusBadge } from '@domain/status/status-badges';
import { MoneyPipe, NumberPipe, PercentPipe, RelativeDatePipe } from '@shared/pipes/format.pipes';

const WINDOW_DAYS = 30;

/** Transiciones del ciclo de vida que la organización puede provocar. */
const LIFECYCLE: Partial<
  Record<CampaignStatus, readonly { status: CampaignStatus; label: string; hint: string }[]>
> = {
  draft: [{ status: 'active', label: 'Publicar', hint: 'Aparecerá en el marketplace' }],
  active: [
    {
      status: 'paused',
      label: 'Pausar',
      hint: 'Deja de aceptar solicitudes y conversiones nuevas',
    },
    { status: 'ended', label: 'Finalizar', hint: 'Cierra la campaña conservando el historial' },
  ],
  paused: [
    { status: 'active', label: 'Reactivar', hint: 'Vuelve a aparecer en el marketplace' },
    { status: 'ended', label: 'Finalizar', hint: 'Cierra la campaña conservando el historial' },
  ],
  ended: [{ status: 'archived', label: 'Archivar', hint: 'La retira de tus listados' }],
};

/**
 * Detalle de campaña para la organización.
 *
 * Las secciones son rutas reales (`/resumen`, `/aplicaciones`…), así que cada
 * pestaña se puede compartir y el historial del navegador funciona. Este
 * componente resuelve el resumen y la configuración; las demás secciones
 * reutilizan las páginas de la organización, filtradas por campaña.
 */
@Component({
  selector: 'rly-organization-campaign-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Badge,
    Button,
    EmptyState,
    Icon,
    Modal,
    Skeleton,
    TabNav,
    AnalyticsCard,
    TrendChart,
    GoalProgress,
    KpiCard,
    AccessBadge,
    CampaignStatusBadge,
    MoneyPipe,
    NumberPipe,
    PercentPipe,
    RelativeDatePipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      @if (campaign.isLoading()) {
        <div class="flex flex-col gap-4">
          <rly-skeleton width="40%" height="2rem" />
          <rly-skeleton shape="block" height="12rem" />
        </div>
      } @else if (campaign.error()) {
        <rly-empty-state
          icon="campaigns"
          title="Esta campaña no existe"
          description="Puede que se haya archivado o que el enlace no sea correcto."
        >
          <a
            rlyButton
            variant="primary"
            [routerLink]="['/app/organization', organizationId(), 'campanas']"
          >
            Ver mis campañas
          </a>
        </rly-empty-state>
      } @else if (campaign.value(); as item) {
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <nav aria-label="Ruta" class="flex flex-wrap items-center gap-1.5 text-ui-sm">
              <a
                [routerLink]="['/app/organization', organizationId(), 'campanas']"
                class="focus-ring rounded-xs text-text-secondary hover:text-ink"
              >
                Campañas
              </a>
              <span class="text-text-muted" aria-hidden="true">/</span>
              <span class="text-text-secondary">{{ item.name }}</span>
            </nav>

            <h2 class="mt-3 text-title-md text-ink">{{ item.name }}</h2>

            <div class="mt-2 flex flex-wrap items-center gap-2">
              <rly-campaign-status [status]="item.status" />
              <rly-access-badge [access]="item.access" internal outline />
              <span class="text-ui-sm text-text-secondary">{{ commission() }}</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <a rlyButton variant="tertiary" [routerLink]="['/campanas', item.slug]">
              Ver ficha pública
              <rly-icon name="external-link" [size]="14" />
            </a>

            @for (action of lifecycle(); track action.status) {
              <button
                rlyButton
                [variant]="action.status === 'ended' ? 'danger' : 'primary'"
                type="button"
                (click)="confirming.set(action)"
              >
                {{ action.label }}
              </button>
            }
          </div>
        </header>

        <rly-tab-nav class="mt-6" [tabs]="tabs()" ariaLabel="Secciones de la campaña" />

        <div class="pt-6">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <rly-kpi-card label="Conversiones" [value]="stats().conversions | rlyNumber" />
            <rly-kpi-card label="Revenue atribuido" [value]="stats().revenue | rlyMoney" />
            <rly-kpi-card label="Afiliados activos" [value]="activeAffiliates() | rlyNumber" />
            <rly-kpi-card
              label="Comisiones a pagar"
              [value]="stats().available | rlyMoney"
              inverted
            />
          </div>

          <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div class="flex min-w-0 flex-col gap-6">
              <rly-analytics-card
                title="¿Cómo evoluciona esta campaña?"
                description="Revenue atribuido por día en los últimos 30 días."
              >
                @defer (on viewport) {
                  <rly-trend-chart [series]="series()" label="Revenue" format="money" />
                } @placeholder {
                  <div class="h-60"></div>
                }
              </rly-analytics-card>

              <!-- Embudo -->
              <rly-analytics-card
                title="¿Dónde se pierde la conversión?"
                description="Recorrido desde el clic hasta la conversión confirmada."
              >
                <ul class="flex flex-col gap-3">
                  @for (stage of funnelStages(); track stage.id) {
                    <li>
                      <div class="flex items-baseline justify-between gap-3">
                        <span class="text-ui text-ink">{{ stage.label }}</span>
                        <span class="text-ui tabular-nums text-text-secondary">
                          {{ stage.value | rlyNumber }}
                        </span>
                      </div>
                      <div class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          class="h-full rounded-full bg-ink transition-[width] duration-reveal"
                          [style.width.%]="funnelShare(stage.value)"
                        ></div>
                      </div>
                    </li>
                  }
                </ul>

                <p class="mt-4 text-ui-sm text-text-muted">
                  Visitas y leads son proporciones simuladas: RELAY no mide tráfico. Clics y
                  conversiones sí salen de los registros.
                </p>
              </rly-analytics-card>

              <!-- Top afiliados -->
              @if (topAffiliates().length) {
                <rly-analytics-card
                  title="¿Quién está trayendo los resultados?"
                  description="Afiliados ordenados por revenue atribuido en la campaña."
                >
                  <ol class="flex flex-col gap-3">
                    @for (row of topAffiliates(); track row.affiliateId; let index = $index) {
                      <li class="flex items-baseline gap-3">
                        <span class="w-4 shrink-0 text-ui-sm tabular-nums text-text-muted">
                          {{ index + 1 }}
                        </span>
                        <span class="min-w-0 flex-1 truncate text-ui text-ink">
                          {{ affiliateName(row.affiliateId) }}
                        </span>
                        <span class="shrink-0 text-ui-sm tabular-nums text-text-secondary">
                          {{ row.conversions }} conv.
                        </span>
                        <span class="w-24 shrink-0 text-right text-ui tabular-nums text-ink">
                          {{ row.revenue | rlyMoney }}
                        </span>
                      </li>
                    }
                  </ol>
                </rly-analytics-card>
              }
            </div>

            <aside class="flex flex-col gap-6">
              <div class="rounded-lg border border-border bg-surface p-5">
                <rly-goal-progress [goal]="item.goal" [current]="stats().conversions" />
              </div>

              <!-- Acciones pendientes -->
              <section
                class="rounded-lg border border-border bg-surface p-5"
                aria-labelledby="pendientes"
              >
                <h3 id="pendientes" class="text-title-xs text-ink">Requiere tu atención</h3>

                <ul class="mt-4 flex flex-col gap-3">
                  <li>
                    <a
                      [routerLink]="[
                        '/app/organization',
                        organizationId(),
                        'campanas',
                        campaignId(),
                        'aplicaciones',
                      ]"
                      class="focus-ring flex items-center gap-3 rounded-sm"
                    >
                      <span class="min-w-0 flex-1 text-ui text-ink">Solicitudes por revisar</span>
                      <span class="text-title-xs tabular-nums text-ink">
                        {{ pendingApplications() }}
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="[
                        '/app/organization',
                        organizationId(),
                        'campanas',
                        campaignId(),
                        'conversiones',
                      ]"
                      class="focus-ring flex items-center gap-3 rounded-sm"
                    >
                      <span class="min-w-0 flex-1 text-ui text-ink">Conversiones por validar</span>
                      <span class="text-title-xs tabular-nums text-ink">
                        {{ pendingConversions() }}
                      </span>
                    </a>
                  </li>
                </ul>
              </section>

              <!-- Condiciones -->
              <section
                class="rounded-lg border border-border bg-surface p-5"
                aria-labelledby="condiciones"
              >
                <h3 id="condiciones" class="text-title-xs text-ink">Condiciones</h3>

                <dl class="mt-3 flex flex-col gap-2.5">
                  <div class="flex items-baseline justify-between gap-3">
                    <dt class="text-ui-sm text-text-secondary">Comisión</dt>
                    <dd class="text-ui text-ink">{{ commission() }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-3">
                    <dt class="text-ui-sm text-text-secondary">Conversión que paga</dt>
                    <dd class="text-ui text-ink">{{ conversionEvent() }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-3">
                    <dt class="text-ui-sm text-text-secondary">Precio</dt>
                    <dd class="text-ui tabular-nums text-ink">{{ item.price | rlyMoney }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-3">
                    <dt class="text-ui-sm text-text-secondary">Tasa de conversión</dt>
                    <dd class="text-ui tabular-nums text-ink">
                      {{ campaignConversionRate() | rlyPercent: 2 }}
                    </dd>
                  </div>
                </dl>
              </section>

              <!-- Actividad -->
              @if (timeline().length) {
                <section
                  class="rounded-lg border border-border bg-surface p-5"
                  aria-labelledby="actividad"
                >
                  <h3 id="actividad" class="text-title-xs text-ink">Actividad reciente</h3>

                  <ol class="mt-4 flex flex-col gap-3">
                    @for (event of timeline().slice(0, 6); track event.id) {
                      <li class="flex items-start gap-2.5">
                        <span [class]="dotClasses(event.tone)" aria-hidden="true"></span>
                        <span class="min-w-0 flex-1">
                          <span class="block text-ui-sm text-ink">{{ event.label }}</span>
                          @if (event.detail) {
                            <span class="block text-ui-sm text-text-secondary">
                              {{ event.detail }}
                            </span>
                          }
                          <span class="block text-ui-sm text-text-muted">
                            {{ event.occurredAt | rlyRelativeDate }}
                          </span>
                        </span>
                      </li>
                    }
                  </ol>
                </section>
              }
            </aside>
          </div>
        </div>
      }
    </div>

    <!-- Confirmación del cambio de estado -->
    @if (confirming(); as action) {
      <rly-modal
        open
        [title]="action.label + ' la campaña'"
        [description]="campaign.value()?.name ?? ''"
        size="sm"
        (closed)="confirming.set(null)"
      >
        <p class="text-ui text-text-secondary">{{ action.hint }}.</p>

        @if (action.status === 'ended') {
          <p class="mt-3 text-ui text-text-secondary">
            Los afiliados activos dejarán de generar comisiones nuevas, pero conservarán su
            historial y sus comisiones pendientes seguirán su curso.
          </p>
        }

        <button modalFooter rlyButton variant="ghost" (click)="confirming.set(null)">
          Cancelar
        </button>
        <button
          modalFooter
          rlyButton
          [variant]="action.status === 'ended' ? 'danger' : 'primary'"
          [loading]="busy()"
          (click)="applyLifecycle(action.status)"
        >
          {{ action.label }}
        </button>
      </rly-modal>
    }
  `,
})
export class OrganizationCampaignPage {
  private readonly catalog = inject(CatalogRepository);
  private readonly engagement = inject(EngagementRepository);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  readonly organizationId = input.required<string>();
  readonly campaignId = input.required<string>();

  protected readonly confirming = signal<{
    status: CampaignStatus;
    label: string;
    hint: string;
  } | null>(null);
  protected readonly busy = signal(false);

  protected readonly campaign = rxResource({
    params: () => this.campaignId(),
    stream: ({ params }) => this.catalog.campaign(params),
  });

  private readonly conversions = rxResource({
    params: () => ({ organizationId: this.organizationId(), campaignId: this.campaignId() }),
    stream: ({ params }) => this.engagement.listConversions(params),
    defaultValue: [],
  });

  private readonly applications = rxResource({
    params: () => ({ organizationId: this.organizationId(), campaignId: this.campaignId() }),
    stream: ({ params }) => this.engagement.listApplications(params),
    defaultValue: [],
  });

  private readonly partnerships = rxResource({
    params: () => ({ organizationId: this.organizationId(), campaignId: this.campaignId() }),
    stream: ({ params }) => this.engagement.listPartnerships(params),
    defaultValue: [],
  });

  private readonly events = rxResource({
    params: () => ({ campaignId: this.campaignId() }),
    stream: ({ params }) => this.engagement.listTimeline(params),
    defaultValue: [],
  });

  private readonly affiliates = rxResource({
    stream: () => this.catalog.listAffiliates(),
    defaultValue: [],
  });

  protected readonly tabs = computed(() => {
    const base = ['/app/organization', this.organizationId(), 'campanas', this.campaignId()];

    return [
      { label: 'Resumen', link: [...base, 'resumen'] },
      { label: 'Aplicaciones', link: [...base, 'aplicaciones'], count: this.pendingApplications() },
      { label: 'Afiliados', link: [...base, 'afiliados'] },
      { label: 'Conversiones', link: [...base, 'conversiones'], count: this.pendingConversions() },
      { label: 'Configuración', link: [...base, 'configuracion'] },
    ];
  });

  protected readonly stats = computed(() => totals(this.conversions.value()));

  protected readonly series = computed(() =>
    dailySeries(withinDays(this.conversions.value(), WINDOW_DAYS), WINDOW_DAYS, 'value'),
  );

  protected readonly activeAffiliates = computed(
    () => this.partnerships.value().filter((partnership) => partnership.status === 'active').length,
  );

  protected readonly pendingApplications = computed(
    () => this.applications.value().filter((item) => PENDING_REVIEW.includes(item.status)).length,
  );

  protected readonly pendingConversions = computed(
    () =>
      this.conversions
        .value()
        .filter((item) => item.status === 'registered' || item.status === 'validating').length,
  );

  protected readonly timeline = computed(() => this.events.value());

  protected readonly commission = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? commissionDetail(campaign) : '';
  });

  protected readonly conversionEvent = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? CONVERSION_EVENT_LABELS[campaign.commission.conversionEvent] : '';
  });

  protected readonly campaignConversionRate = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? conversionRate(this.stats().conversions, campaign.metrics.clicks || 1) : 0;
  });

  protected readonly funnelStages = computed(() => {
    const campaign = this.campaign.value();
    return funnel(campaign?.metrics.clicks ?? 0, this.stats().conversions);
  });

  protected readonly topAffiliates = computed(() => {
    const grouped = new Map<string, { conversions: number; revenue: number }>();

    for (const conversion of this.conversions.value()) {
      if (conversion.status === 'rejected' || conversion.status === 'refunded') continue;

      const current = grouped.get(conversion.affiliateId) ?? { conversions: 0, revenue: 0 };
      grouped.set(conversion.affiliateId, {
        conversions: current.conversions + 1,
        revenue: current.revenue + conversion.value,
      });
    }

    return [...grouped.entries()]
      .map(([affiliateId, values]) => ({ affiliateId, ...values }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  });

  protected readonly lifecycle = computed(() => {
    const status = this.campaign.value()?.status;
    return status ? (LIFECYCLE[status] ?? []) : [];
  });

  protected funnelShare(value: number): number {
    const max = this.funnelStages()[0]?.value ?? 1;
    return max ? (value / max) * 100 : 0;
  }

  protected affiliateName(affiliateId: string): string {
    return (
      this.affiliates.value().find((affiliate) => affiliate.id === affiliateId)?.name ?? affiliateId
    );
  }

  protected dotClasses(tone: string): string {
    const base = 'mt-1.5 size-2 shrink-0 rounded-full';

    return (
      { success: `${base} bg-success`, warning: `${base} bg-warning`, danger: `${base} bg-danger` }[
        tone
      ] ?? `${base} bg-border-strong`
    );
  }

  protected async applyLifecycle(status: CampaignStatus): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);

    try {
      await firstValueFrom(this.catalog.updateCampaign(this.campaignId(), { status }));
      this.campaign.reload();
      this.confirming.set(null);

      this.toasts.success(
        {
          active: 'Campaña activa',
          paused: 'Campaña pausada',
          ended: 'Campaña finalizada',
          archived: 'Campaña archivada',
        }[status as 'active' | 'paused' | 'ended' | 'archived'] ?? 'Campaña actualizada',
      );

      if (status === 'archived') {
        await this.router.navigate(['/app/organization', this.organizationId(), 'campanas']);
      }
    } catch {
      this.toasts.error('No se pudo cambiar el estado de la campaña');
    } finally {
      this.busy.set(false);
    }
  }
}
