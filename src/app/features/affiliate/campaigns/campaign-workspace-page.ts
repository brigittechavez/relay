import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { InputField } from '@ds/input/input';
import { Modal } from '@ds/modal/modal';
import { Select, SelectField } from '@ds/select/select';
import { Skeleton } from '@ds/skeleton/skeleton';
import { TabPanel, Tabs } from '@ds/tabs/tabs';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { ChannelId, channelLabel } from '@data/models/taxonomy';
import {
  breakdownByChannel,
  conversionRate,
  dailySeries,
  totals,
  withinDays,
} from '@data/logic/analytics';
import { commissionDetail } from '@data/logic/commission';
import { AnalyticsCard } from '@domain/analytics-card/analytics-card';
import { TrendChart } from '@domain/chart/trend-chart';
import { GoalProgress } from '@domain/goal-progress/goal-progress';
import { KpiCard } from '@domain/kpi/kpi-card';
import { ConversionStatusBadge, PartnershipStatusBadge } from '@domain/status/status-badges';
import { copyToClipboard } from '@shared/utils/clipboard';
import {
  DatePipe,
  MoneyPipe,
  NumberPipe,
  PercentPipe,
  RelativeDatePipe,
} from '@shared/pipes/format.pipes';

const WINDOW_DAYS = 30;

/**
 * Espacio de trabajo de una campaña aprobada.
 *
 * Cinco secciones: qué está pasando, con qué se promociona, qué materiales
 * hay, cómo va cada link y qué ha ocurrido. Es la única vista del área de
 * afiliado con pestañas, porque es la única con cinco lecturas distintas del
 * mismo objeto.
 */
@Component({
  selector: 'rly-campaign-workspace-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    Badge,
    Button,
    EmptyState,
    Field,
    Icon,
    InputField,
    Modal,
    Select,
    SelectField,
    Skeleton,
    Tabs,
    TabPanel,
    AnalyticsCard,
    TrendChart,
    GoalProgress,
    KpiCard,
    ConversionStatusBadge,
    PartnershipStatusBadge,
    DatePipe,
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
      } @else if (!partnership()) {
        <rly-empty-state
          icon="campaigns"
          title="No estás en esta campaña"
          description="Solo puedes abrir el espacio de trabajo de campañas en las que participas."
        >
          <a rlyButton variant="primary" routerLink="/app/affiliate/campanas"> Ver mis campañas </a>
        </rly-empty-state>
      } @else if (campaign.value(); as item) {
        <!-- Cabecera -->
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <nav aria-label="Ruta" class="flex flex-wrap items-center gap-1.5 text-ui-sm">
              <a
                routerLink="/app/affiliate/campanas"
                class="focus-ring rounded-xs text-text-secondary hover:text-ink"
              >
                Campañas
              </a>
              <span class="text-text-muted" aria-hidden="true">/</span>
              <span class="text-text-secondary">{{ item.name }}</span>
            </nav>

            <h2 class="mt-3 text-title-md text-ink">{{ item.name }}</h2>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <span class="text-ui text-text-secondary">{{ organizationName() }}</span>
              @if (partnership(); as link) {
                <rly-partnership-status [status]="link.status" />
              }
            </div>
          </div>

          <div class="flex gap-2">
            <a rlyButton variant="tertiary" [routerLink]="['/campanas', item.slug]">
              Ver campaña
              <rly-icon name="external-link" [size]="14" />
            </a>
            <button rlyButton variant="primary" type="button" (click)="openLinkModal()">
              <rly-icon name="plus" [size]="16" />
              Nuevo link
            </button>
          </div>
        </header>

        <rly-tabs
          class="mt-6"
          [tabs]="tabs()"
          [selected]="tab()"
          idPrefix="workspace"
          (selectedChange)="tab.set($event)"
        />

        <rly-tab-panel [for]="tab()" idPrefix="workspace" class="pt-6">
          @switch (tab()) {
            <!-- Resumen -->
            @case ('resumen') {
              <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <rly-kpi-card label="Clics" [value]="clicks() | rlyNumber" />
                <rly-kpi-card label="Conversiones" [value]="stats().conversions | rlyNumber" />
                <rly-kpi-card
                  label="Tasa de conversión"
                  [value]="conversionRateValue() | rlyPercent: 2"
                />
                <rly-kpi-card label="Comisión" [value]="stats().commission | rlyMoney" />
              </div>

              <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <rly-analytics-card
                  title="¿Cómo evoluciona esta campaña?"
                  description="Comisión generada por día en los últimos 30 días."
                >
                  @defer (on viewport) {
                    <rly-trend-chart [series]="series()" label="Comisiones" format="money" />
                  } @placeholder {
                    <div class="h-60"></div>
                  }
                </rly-analytics-card>

                <div class="flex flex-col gap-6">
                  <div class="rounded-lg border border-border bg-surface p-5">
                    <rly-goal-progress [goal]="item.goal" [current]="goalProgress()" />
                  </div>

                  <div class="rounded-lg border border-border bg-surface p-5">
                    <h3 class="text-title-xs text-ink">Condiciones</h3>
                    <dl class="mt-3 flex flex-col gap-2.5">
                      <div class="flex items-baseline justify-between gap-3">
                        <dt class="text-ui-sm text-text-secondary">Comisión</dt>
                        <dd class="text-ui text-ink">{{ commission() }}</dd>
                      </div>
                      <div class="flex items-baseline justify-between gap-3">
                        <dt class="text-ui-sm text-text-secondary">Precio</dt>
                        <dd class="text-ui tabular-nums text-ink">{{ item.price | rlyMoney }}</dd>
                      </div>
                      @if (item.commission.bonus; as bonus) {
                        <div class="flex items-baseline justify-between gap-3">
                          <dt class="text-ui-sm text-text-secondary">Bono</dt>
                          <dd class="text-ui tabular-nums text-ink">
                            {{ bonus.amount | rlyMoney }}
                          </dd>
                        </div>
                      }
                    </dl>
                  </div>
                </div>
              </div>
            }

            <!-- Links y códigos -->
            @case ('links') {
              @if (links().length) {
                <ul class="flex flex-col gap-3">
                  @for (link of links(); track link.id) {
                    <li class="rounded-lg border border-border bg-surface p-4">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="flex items-center gap-2 text-ui font-medium text-ink">
                            {{ link.name }}
                            @if (!link.active) {
                              <rly-badge tone="neutral">Inactivo</rly-badge>
                            }
                          </p>
                          <p class="mt-0.5 text-ui-sm text-text-secondary">
                            {{ channelName(link.channel) }} · creado
                            {{ link.createdAt | rlyRelativeDate }}
                          </p>
                        </div>

                        <button
                          rlyButton
                          variant="tertiary"
                          size="sm"
                          type="button"
                          (click)="copy(urlFor(link.slug), 'Link copiado')"
                        >
                          <rly-icon name="copy" [size]="14" />
                          Copiar link
                        </button>
                      </div>

                      <p
                        class="mt-3 truncate rounded-sm bg-surface-muted px-3 py-2 font-mono
                               text-ui-sm text-text-secondary"
                      >
                        {{ urlFor(link.slug) }}
                      </p>

                      <dl class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <dt class="text-ui-sm text-text-muted">Clics</dt>
                          <dd class="text-ui tabular-nums text-ink">
                            {{ link.clicks | rlyNumber }}
                          </dd>
                        </div>
                        <div>
                          <dt class="text-ui-sm text-text-muted">Conversiones</dt>
                          <dd class="text-ui tabular-nums text-ink">{{ link.conversions }}</dd>
                        </div>
                        <div>
                          <dt class="text-ui-sm text-text-muted">CVR</dt>
                          <dd class="text-ui tabular-nums text-ink">
                            {{ rateFor(link.clicks, link.conversions) | rlyPercent: 2 }}
                          </dd>
                        </div>
                        <div>
                          <dt class="text-ui-sm text-text-muted">Comisión</dt>
                          <dd class="text-ui tabular-nums text-ink">
                            {{ link.commission | rlyMoney }}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  }
                </ul>
              } @else {
                <div class="rounded-lg border border-border bg-surface">
                  <rly-empty-state
                    icon="link"
                    title="Todavía no has creado ningún link"
                    description="Crea uno por canal para saber cuál te funciona mejor."
                  >
                    <button rlyButton variant="primary" type="button" (click)="openLinkModal()">
                      Crear mi primer link
                    </button>
                  </rly-empty-state>
                </div>
              }

              <!-- Código promocional -->
              @if (promoCode(); as code) {
                <section
                  class="mt-6 rounded-lg border border-border bg-surface p-5"
                  aria-labelledby="codigo"
                >
                  <h3 id="codigo" class="text-title-xs text-ink">Tu código promocional</h3>
                  <p class="mt-1 text-ui-sm text-text-secondary">{{ code.benefit }}</p>

                  <div class="mt-4 flex flex-wrap items-center gap-3">
                    <p
                      class="rounded-md border border-dashed border-border-strong bg-canvas px-4
                             py-2.5 font-mono text-title-xs tracking-wider text-ink"
                    >
                      {{ code.code }}
                    </p>
                    <button
                      rlyButton
                      variant="tertiary"
                      type="button"
                      (click)="copy(code.code, 'Código copiado')"
                    >
                      <rly-icon name="copy" [size]="14" />
                      Copiar código
                    </button>
                    <span class="text-ui-sm text-text-muted">
                      {{ code.conversions }} conversiones con este código
                    </span>
                  </div>
                </section>
              }
            }

            <!-- Recursos -->
            @case ('recursos') {
              @if (item.resources.length) {
                <ul class="flex flex-col gap-3">
                  @for (resource of item.resources; track resource.id) {
                    <li class="rounded-lg border border-border bg-surface p-5">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-ui font-medium text-ink">{{ resource.title }}</p>
                          <p class="mt-0.5 text-ui-sm text-text-secondary">
                            {{ resource.description }}
                          </p>
                        </div>

                        @if (resource.body) {
                          <button
                            rlyButton
                            variant="tertiary"
                            size="sm"
                            type="button"
                            (click)="copy(resource.body, 'Texto copiado')"
                          >
                            <rly-icon name="copy" [size]="14" />
                            Copiar
                          </button>
                        } @else {
                          <span class="text-ui-sm text-text-muted">{{ resource.format }}</span>
                        }
                      </div>

                      @if (resource.body) {
                        <p class="mt-3 rounded-md bg-surface-muted p-4 text-ui text-text-secondary">
                          {{ resource.body }}
                        </p>
                      }
                    </li>
                  }
                </ul>

                <p class="mt-4 text-ui-sm text-text-muted">
                  Los archivos son simulados; los textos sí se copian.
                </p>
              } @else {
                <div class="rounded-lg border border-border bg-surface">
                  <rly-empty-state
                    icon="resources"
                    title="Esta campaña no publica materiales"
                    description="La promoción es libre dentro de las restricciones indicadas en la campaña."
                  />
                </div>
              }
            }

            <!-- Rendimiento -->
            @case ('rendimiento') {
              @if (channelBreakdown().length) {
                <rly-analytics-card
                  title="¿Qué canal funciona mejor?"
                  description="Rendimiento acumulado de tus links en esta campaña."
                >
                  <ul class="flex flex-col divide-y divide-border">
                    @for (row of channelBreakdown(); track row.channel) {
                      <li class="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 first:pt-0">
                        <span class="min-w-0 flex-1 text-ui text-ink">
                          {{ channelName(row.channel) }}
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
                            {{ row.conversions }}
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
                      </li>
                    }
                  </ul>

                  @if (bestChannel(); as best) {
                    <p class="mt-4 flex items-start gap-2 text-ui-sm text-text-secondary">
                      <rly-icon name="trending-up" [size]="15" class="mt-0.5 text-success" />
                      <span>
                        {{ channelName(best.channel) }} es tu mejor canal en esta campaña, con
                        {{ best.conversionRate | rlyPercent: 2 }} de conversión.
                      </span>
                    </p>
                  }
                </rly-analytics-card>

                <!-- Conversiones -->
                <section class="mt-6" aria-labelledby="conversiones">
                  <h3 id="conversiones" class="text-title-xs text-ink">Conversiones</h3>

                  <ul class="mt-4 flex flex-col gap-2">
                    @for (conversion of campaignConversions(); track conversion.id) {
                      <li
                        class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border
                               border-border bg-surface p-4"
                      >
                        <span class="w-24 font-mono text-ui-sm text-text-muted">
                          {{ conversion.id }}
                        </span>
                        <span class="min-w-0 flex-1 text-ui text-ink">
                          {{ channelName(conversion.channel) }}
                        </span>
                        <span class="text-ui-sm text-text-secondary">
                          {{ conversion.occurredAt | rlyDate }}
                        </span>
                        <rly-conversion-status [status]="conversion.status" />
                        <span class="w-24 text-right text-ui tabular-nums text-ink">
                          {{ conversion.commission | rlyMoney }}
                        </span>
                      </li>
                    }
                  </ul>
                </section>
              } @else {
                <div class="rounded-lg border border-border bg-surface">
                  <rly-empty-state
                    icon="analytics"
                    title="Todavía no hay datos de rendimiento"
                    description="En cuanto crees un link empezarás a ver clics, conversiones y comisiones."
                  >
                    <button rlyButton variant="primary" type="button" (click)="openLinkModal()">
                      Crear un link
                    </button>
                  </rly-empty-state>
                </div>
              }
            }

            <!-- Actividad -->
            @case ('actividad') {
              @if (timeline().length) {
                <ol class="flex flex-col">
                  @for (event of timeline(); track event.id) {
                    <li class="flex gap-4">
                      <span class="flex flex-col items-center">
                        <span [class]="dotClasses(event.tone)" aria-hidden="true"></span>
                        <span class="w-px flex-1 bg-border"></span>
                      </span>

                      <span class="flex-1 pb-6">
                        <span class="block text-ui text-ink">{{ event.label }}</span>
                        @if (event.detail) {
                          <span class="mt-0.5 block text-ui-sm text-text-secondary">
                            {{ event.detail }}
                          </span>
                        }
                        <span class="mt-1 block text-ui-sm text-text-muted">
                          {{ event.occurredAt | rlyRelativeDate }}
                        </span>
                      </span>
                    </li>
                  }
                </ol>
              } @else {
                <div class="rounded-lg border border-border bg-surface">
                  <rly-empty-state
                    icon="activity"
                    title="Sin actividad registrada"
                    description="Aquí aparecerán las aprobaciones, los links creados y las conversiones."
                  />
                </div>
              }
            }
          }
        </rly-tab-panel>
      }
    </div>

    <!-- Crear link -->
    <rly-modal
      [open]="linkModalOpen()"
      title="Nuevo link de seguimiento"
      description="Un link por canal o por pieza: así sabes cuál funciona."
      size="sm"
      (closed)="linkModalOpen.set(false)"
    >
      <form class="flex flex-col gap-5" (ngSubmit)="createLink()">
        <rly-field
          label="Nombre del link"
          hint="Para ti: «Reel lanzamiento», «Newsletter agosto»…"
          required
          [error]="nameError()"
        >
          <input
            rlyInput
            type="text"
            name="linkName"
            [ngModel]="linkName()"
            (ngModelChange)="linkName.set($event)"
          />
        </rly-field>

        <rly-field label="Canal" required>
          <rly-select>
            <select
              rlySelect
              name="linkChannel"
              [ngModel]="linkChannel()"
              (ngModelChange)="linkChannel.set($event)"
            >
              @for (channel of allowedChannels(); track channel) {
                <option [value]="channel">{{ channelName(channel) }}</option>
              }
            </select>
          </rly-select>
        </rly-field>

        <p class="text-ui-sm text-text-muted">
          El seguimiento es simulado: al crear el link se le atribuye el rendimiento típico de ese
          canal.
        </p>
      </form>

      <button modalFooter rlyButton variant="ghost" (click)="linkModalOpen.set(false)">
        Cancelar
      </button>
      <button modalFooter rlyButton variant="primary" [loading]="busy()" (click)="createLink()">
        Crear link
      </button>
    </rly-modal>
  `,
})
export class CampaignWorkspacePage {
  private readonly session = inject(SessionStore);
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  readonly campaignId = input.required<string>();

  protected readonly tab = signal('resumen');
  protected readonly linkModalOpen = signal(false);
  protected readonly linkName = signal('');
  protected readonly linkChannel = signal<ChannelId>('instagram');
  protected readonly busy = signal(false);
  private readonly touched = signal(false);

  private readonly affiliateId = computed(() => this.session.affiliate()?.id ?? null);

  /** Sin perfil no hay nada que consultar: el recurso queda inactivo. */
  private readonly scope = computed(() => {
    const affiliateId = this.affiliateId();
    return affiliateId ? { affiliateId, campaignId: this.campaignId() } : undefined;
  });

  protected readonly campaign = rxResource({
    params: () => this.campaignId(),
    stream: ({ params }) => this.catalog.campaign(params),
  });

  private readonly organization = rxResource({
    params: () => this.campaign.value()?.organizationId,
    stream: ({ params }) => this.catalog.organization(params!),
    defaultValue: undefined,
  });

  private readonly partnerships = rxResource({
    params: () => this.scope(),
    stream: ({ params }) => this.engagement.listPartnerships(params),
    defaultValue: [],
  });

  private readonly linkList = rxResource({
    params: () => this.scope(),
    stream: ({ params }) => this.engagement.listLinks(params),
    defaultValue: [],
  });

  private readonly codes = rxResource({
    params: () => this.scope(),
    stream: ({ params }) => this.engagement.listPromoCodes(params),
    defaultValue: [],
  });

  private readonly conversions = rxResource({
    params: () => this.scope(),
    stream: ({ params }) => this.engagement.listConversions(params),
    defaultValue: [],
  });

  private readonly events = rxResource({
    params: () => this.scope(),
    stream: ({ params }) => this.engagement.listTimeline(params),
    defaultValue: [],
  });

  protected readonly partnership = computed(() => this.partnerships.value()[0] ?? null);
  protected readonly links = computed(() => this.linkList.value());
  protected readonly promoCode = computed(() => this.codes.value()[0] ?? null);
  protected readonly campaignConversions = computed(() => this.conversions.value());
  protected readonly timeline = computed(() => this.events.value());

  protected readonly organizationName = computed(() => this.organization.value()?.name ?? '');

  protected readonly commission = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? commissionDetail(campaign) : '';
  });

  protected readonly tabs = computed(() => [
    { id: 'resumen', label: 'Resumen' },
    { id: 'links', label: 'Links y códigos', count: this.links().length },
    { id: 'recursos', label: 'Recursos', count: this.campaign.value()?.resources.length ?? 0 },
    { id: 'rendimiento', label: 'Rendimiento' },
    { id: 'actividad', label: 'Actividad' },
  ]);

  protected readonly stats = computed(() => totals(this.conversions.value()));

  protected readonly clicks = computed(() =>
    this.links().reduce((total, link) => total + link.clicks, 0),
  );

  protected readonly conversionRateValue = computed(() =>
    conversionRate(this.stats().conversions, this.clicks()),
  );

  protected readonly series = computed(() =>
    dailySeries(withinDays(this.conversions.value(), WINDOW_DAYS), WINDOW_DAYS, 'commission'),
  );

  protected readonly channelBreakdown = computed(() => breakdownByChannel(this.links()));

  protected readonly bestChannel = computed(
    () =>
      [...this.channelBreakdown()].sort((a, b) => b.conversionRate - a.conversionRate)[0] ?? null,
  );

  /** Progreso hacia la meta, en la unidad que la campaña haya definido. */
  protected readonly goalProgress = computed(() => {
    const goal = this.campaign.value()?.goal;
    if (!goal) return 0;

    if (goal.unit === 'clicks') return this.clicks();
    if (goal.unit === 'commission') return this.stats().commission;
    return this.stats().conversions;
  });

  protected readonly allowedChannels = computed(() => {
    const owned = new Set(this.session.affiliate()?.channels.map((channel) => channel.id) ?? []);
    const allowed = (this.campaign.value()?.channels ?? []).filter((channel) => owned.has(channel));

    return allowed.length ? allowed : (this.campaign.value()?.channels ?? []);
  });

  protected readonly nameError = computed(() =>
    this.touched() && this.linkName().trim().length < 3
      ? 'Escribe un nombre de al menos 3 caracteres'
      : null,
  );

  protected openLinkModal(): void {
    this.touched.set(false);
    this.linkName.set('');
    this.linkChannel.set(this.allowedChannels()[0] ?? 'instagram');
    this.linkModalOpen.set(true);
  }

  protected async createLink(): Promise<void> {
    const affiliateId = this.affiliateId();
    if (!affiliateId || this.busy()) return;

    this.touched.set(true);
    if (this.nameError()) return;

    this.busy.set(true);

    try {
      await firstValueFrom(
        this.engagement.createLink({
          campaignId: this.campaignId(),
          affiliateId,
          name: this.linkName().trim(),
          channel: this.linkChannel(),
        }),
      );

      this.linkList.reload();
      this.conversions.reload();
      this.events.reload();
      this.linkModalOpen.set(false);
      this.tab.set('links');
      this.toasts.success('Link creado');
    } catch {
      this.toasts.error('No se pudo crear el link');
    } finally {
      this.busy.set(false);
    }
  }

  protected async copy(value: string, message: string): Promise<void> {
    const copied = await copyToClipboard(value);
    if (copied) {
      this.toasts.success(message);
    } else {
      this.toasts.error('No se pudo copiar al portapapeles');
    }
  }

  protected urlFor(slug: string): string {
    return `https://rly.pe/${slug}`;
  }

  protected channelName(channel: ChannelId): string {
    return channelLabel(channel);
  }

  protected rateFor(clicks: number, conversions: number): number {
    return conversionRate(conversions, clicks);
  }

  protected dotClasses(tone: string): string {
    const base = 'mt-1.5 size-2.5 shrink-0 rounded-full';

    return (
      {
        success: `${base} bg-success`,
        warning: `${base} bg-warning`,
        danger: `${base} bg-danger`,
        neutral: `${base} bg-border-strong`,
      }[tone] ?? `${base} bg-border-strong`
    );
  }
}
