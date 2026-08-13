import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
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
import {
  ATTRIBUTION_LABELS,
  CONVERSION_EVENT_LABELS,
  PRICE_UNIT_SUFFIX,
} from '@data/models/campaign';
import { TAG_LABELS, categoryLabel, channelLabel, subcategoryLabel } from '@data/models/taxonomy';
import { commissionDetail } from '@data/logic/commission';
import { computeMatchScore, evaluateEligibility } from '@data/logic/matching';
import { daysUntil } from '@data/seed/demo-clock';
import { CampaignCover } from '@domain/campaign-cover/campaign-cover';
import { EarningsCalculator } from '@domain/earnings-calculator/earnings-calculator';
import { EligibilityChecklist } from '@domain/eligibility/eligibility-checklist';
import { MatchScore } from '@domain/match-score/match-score';
import { AccessBadge, EndingBadge } from '@domain/status/status-badges';
import { ApplyLauncher } from '@features/affiliate/apply/apply-launcher';
import { MoneyPipe, NumberPipe, PercentPipe } from '@shared/pipes/format.pipes';

/**
 * Detalle público de una campaña.
 *
 * En escritorio el panel de decisión queda fijo a la derecha mientras se lee el
 * contenido; en móvil ese panel se reduce a una barra inferior fija con la
 * comisión y la acción principal, que es lo único que no puede perderse de
 * vista al hacer scroll.
 *
 * La página se sirve por SSR cuando la ruta no está prerenderizada, así que el
 * contenido y los metadatos existen antes de que arranque JavaScript.
 */
@Component({
  selector: 'rly-campaign-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Badge,
    Button,
    EmptyState,
    Icon,
    Skeleton,
    CampaignCover,
    EarningsCalculator,
    EligibilityChecklist,
    MatchScore,
    AccessBadge,
    EndingBadge,
    ApplyLauncher,
    MoneyPipe,
    NumberPipe,
    PercentPipe,
  ],
  host: { class: 'block' },
  template: `
    @if (campaign.isLoading()) {
      <div class="container-page py-10">
        <rly-skeleton shape="block" height="16rem" />
        <div class="mt-6 flex max-w-2xl flex-col gap-3">
          <rly-skeleton width="30%" />
          <rly-skeleton width="70%" height="2rem" />
          <rly-skeleton width="90%" />
        </div>
      </div>
    } @else if (campaign.error()) {
      <div class="container-page py-16">
        <rly-empty-state
          icon="alert"
          title="Esta campaña no está disponible"
          description="Puede que se haya archivado o que el enlace no sea correcto."
        >
          <a rlyButton variant="primary" routerLink="/marketplace">Volver al marketplace</a>
        </rly-empty-state>
      </div>
    } @else if (campaign.value(); as item) {
      <article class="pb-24 lg:pb-0">
        <!-- Portada -->
        <div class="container-page pt-6">
          <rly-campaign-cover
            [cover]="item.cover"
            [categoryId]="item.categoryId"
            size="lg"
            class="rounded-lg"
          />
        </div>

        <div class="container-page grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <!-- Contenido -->
          <div class="min-w-0">
            <nav aria-label="Ruta" class="flex flex-wrap items-center gap-1.5 text-ui-sm">
              <a routerLink="/marketplace" class="focus-ring rounded-xs text-text-secondary hover:text-ink">
                Marketplace
              </a>
              <span class="text-text-muted" aria-hidden="true">/</span>
              <span class="text-text-secondary">{{ category() }}</span>
            </nav>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <rly-access-badge [access]="item.access" />
              <rly-ending-badge [campaign]="item" />
              @for (tag of item.tags; track tag) {
                <rly-badge tone="neutral" outline>{{ tagLabel(tag) }}</rly-badge>
              }
            </div>

            <h1 class="mt-4 text-title-md text-ink">{{ item.name }}</h1>

            @if (organization.value(); as org) {
              <a
                [routerLink]="['/organizaciones', org.slug]"
                class="focus-ring mt-3 inline-flex items-center gap-2.5 rounded-sm"
              >
                <span
                  class="grid size-9 place-items-center rounded-sm bg-ink text-ui-sm font-semibold
                         text-text-inverse"
                  aria-hidden="true"
                >
                  {{ org.initials }}
                </span>
                <span>
                  <span class="flex items-center gap-1.5 text-ui font-medium text-ink">
                    {{ org.name }}
                    @if (org.trustSignals.includes('verified')) {
                      <rly-icon name="verified" [size]="15" class="text-info" label="Organización verificada" />
                    }
                  </span>
                  <span class="block text-ui-sm text-text-secondary">{{ org.location }}</span>
                </span>
              </a>
            }

            <!-- Resumen de decisión en móvil: el panel lateral no existe a este
                 ancho y la compatibilidad no puede quedarse fuera de la vista. -->
            @if (matchScore() !== null) {
              <div
                class="mt-5 flex items-center gap-3 rounded-lg border border-border bg-surface
                       p-4 lg:hidden"
              >
                <rly-match-score [value]="matchScore()!" size="lg" [showLabel]="false" />
                <div>
                  <p class="text-ui font-medium text-ink">
                    {{ matchScore() }}% de compatibilidad
                  </p>
                  <p class="text-ui-sm text-text-secondary">Según tu perfil y tus canales</p>
                </div>
              </div>
            }

            <!-- Navegación interna -->
            <nav aria-label="Secciones de la campaña" class="mt-8 border-b border-border">
              <ul class="scrollbar-none flex gap-6 overflow-x-auto">
                @for (section of sections; track section.id) {
                  <li>
                    <a
                      [href]="'#' + section.id"
                      class="focus-ring -mb-px block shrink-0 rounded-t-xs border-b-2
                             border-transparent px-1 pb-3 text-ui font-medium text-text-secondary
                             transition-colors hover:text-ink"
                    >
                      {{ section.label }}
                    </a>
                  </li>
                }
              </ul>
            </nav>

            <section id="resumen" class="pt-8" aria-labelledby="resumen-titulo">
              <h2 id="resumen-titulo" class="text-title-sm text-ink">Resumen</h2>
              @for (paragraph of paragraphs(); track $index) {
                <p class="mt-3 max-w-prose text-body text-text-secondary">{{ paragraph }}</p>
              }

              <dl class="mt-6 grid gap-4 sm:grid-cols-2">
                <div class="rounded-md border border-border bg-surface p-4">
                  <dt class="text-ui-sm text-text-muted">Oferta</dt>
                  <dd class="mt-1 text-ui text-ink">{{ item.offer }}</dd>
                </div>
                <div class="rounded-md border border-border bg-surface p-4">
                  <dt class="text-ui-sm text-text-muted">Audiencia objetivo</dt>
                  <dd class="mt-1 text-ui text-ink">{{ item.audience }}</dd>
                </div>
              </dl>
            </section>

            <section id="comision" class="pt-10" aria-labelledby="comision-titulo">
              <h2 id="comision-titulo" class="text-title-sm text-ink">Comisión y atribución</h2>

              <dl class="mt-4 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
                <div class="bg-surface p-4">
                  <dt class="text-ui-sm text-text-muted">Comisión</dt>
                  <dd class="mt-1 text-ui font-medium text-ink">{{ commission() }}</dd>
                </div>
                <div class="bg-surface p-4">
                  <dt class="text-ui-sm text-text-muted">Conversión que paga</dt>
                  <dd class="mt-1 text-ui font-medium text-ink">{{ conversionEvent() }}</dd>
                </div>
                <div class="bg-surface p-4">
                  <dt class="text-ui-sm text-text-muted">Ventana de atribución</dt>
                  <dd class="mt-1 text-ui font-medium text-ink">{{ attribution() }}</dd>
                </div>
                <div class="bg-surface p-4">
                  <dt class="text-ui-sm text-text-muted">Duración</dt>
                  <dd class="mt-1 text-ui font-medium text-ink">{{ duration() }}</dd>
                </div>
              </dl>

              @if (item.commission.bonus; as bonus) {
                <p
                  class="mt-4 flex items-start gap-2 rounded-md border border-accent/50
                         bg-accent-soft px-4 py-3 text-ui text-ink"
                >
                  <rly-icon name="target" [size]="16" class="mt-0.5" />
                  <span>
                    Bono de {{ bonus.amount | rlyMoney }} al alcanzar
                    {{ bonus.threshold }} conversiones aprobadas.
                  </span>
                </p>
              }

              <div class="mt-6 rounded-lg border border-border bg-surface p-5">
                <h3 class="text-title-xs text-ink">Calculadora de ingresos</h3>
                <rly-earnings-calculator class="mt-4" [campaign]="item" />
              </div>
            </section>

            <section id="requisitos" class="pt-10" aria-labelledby="requisitos-titulo">
              <h2 id="requisitos-titulo" class="sr-only">Requisitos</h2>

              @if (eligibility(); as result) {
                <div class="rounded-lg border border-border bg-surface p-5">
                  <rly-eligibility-checklist [eligibility]="result" />
                </div>
              } @else {
                <div class="rounded-lg border border-border bg-surface p-5">
                  <h3 class="text-title-xs text-ink">Requisitos</h3>
                  <ul class="mt-3 flex flex-col gap-2.5">
                    @for (requirement of item.requirements; track requirement.id) {
                      <li class="flex items-start gap-2.5 text-ui text-text-secondary">
                        <rly-icon name="chevron-right" [size]="14" class="mt-1 text-text-muted" />
                        <span>
                          {{ requirement.label }}
                          @if (!requirement.mandatory) {
                            <span class="text-text-muted">· recomendado</span>
                          }
                        </span>
                      </li>
                    }
                  </ul>
                  <p class="mt-4 text-ui-sm text-text-muted">
                    Entra en la demo para ver cuáles cumples y tu compatibilidad con la campaña.
                  </p>
                </div>
              }

              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <div class="rounded-lg border border-border bg-surface p-5">
                  <h3 class="text-title-xs text-ink">Canales permitidos</h3>
                  <ul class="mt-3 flex flex-wrap gap-1.5">
                    @for (channel of item.channels; track channel) {
                      <li><rly-badge tone="neutral" outline>{{ channelName(channel) }}</rly-badge></li>
                    }
                  </ul>
                </div>

                @if (item.restrictions.length) {
                  <div class="rounded-lg border border-border bg-surface p-5">
                    <h3 class="text-title-xs text-ink">Restricciones</h3>
                    <ul class="mt-3 flex flex-col gap-2">
                      @for (restriction of item.restrictions; track restriction) {
                        <li class="flex items-start gap-2 text-ui-sm text-text-secondary">
                          <rly-icon name="ban" [size]="14" class="mt-0.5 text-text-muted" />
                          <span>{{ restriction }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </section>

            <section id="recursos" class="pt-10" aria-labelledby="recursos-titulo">
              <h2 id="recursos-titulo" class="text-title-sm text-ink">Recursos</h2>

              @if (item.resources.length) {
                <ul class="mt-4 flex flex-col gap-2">
                  @for (resource of item.resources; track resource.id) {
                    <li class="flex items-start gap-3 rounded-md border border-border bg-surface p-4">
                      <span
                        class="grid size-9 shrink-0 place-items-center rounded-sm bg-surface-muted
                               text-text-secondary"
                        aria-hidden="true"
                      >
                        <rly-icon [name]="resourceIcon(resource.kind)" [size]="16" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-ui font-medium text-ink">{{ resource.title }}</span>
                        <span class="block text-ui-sm text-text-secondary">
                          {{ resource.description }}
                        </span>
                      </span>
                      <span class="shrink-0 text-ui-sm text-text-muted">
                        {{ resource.format ?? 'Texto' }}
                      </span>
                    </li>
                  }
                </ul>
                <p class="mt-3 text-ui-sm text-text-muted">
                  Los recursos se descargan y se copian desde el espacio de la campaña, una vez
                  aprobada la solicitud.
                </p>
              } @else {
                <p class="mt-3 text-ui text-text-secondary">
                  Esta campaña no publica materiales: la promoción es libre dentro de las
                  restricciones indicadas.
                </p>
              }
            </section>

            <section id="empresa" class="pt-10" aria-labelledby="empresa-titulo">
              <h2 id="empresa-titulo" class="text-title-sm text-ink">La organización</h2>

              @if (organization.value(); as org) {
                <div class="mt-4 rounded-lg border border-border bg-surface p-5">
                  <p class="text-body text-text-secondary">{{ org.description }}</p>

                  <dl class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <dt class="text-ui-sm text-text-muted">Afiliados activos</dt>
                      <dd class="mt-1 text-ui font-medium tabular-nums text-ink">
                        {{ org.metrics.activeAffiliates }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-ui-sm text-text-muted">Revisión media</dt>
                      <dd class="mt-1 text-ui font-medium tabular-nums text-ink">
                        {{ org.metrics.averageReviewDays }} días
                      </dd>
                    </div>
                    <div>
                      <dt class="text-ui-sm text-text-muted">Aprobación</dt>
                      <dd class="mt-1 text-ui font-medium tabular-nums text-ink">
                        {{ org.metrics.approvalRate | rlyPercent: 0 }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-ui-sm text-text-muted">Campañas completadas</dt>
                      <dd class="mt-1 text-ui font-medium tabular-nums text-ink">
                        {{ org.metrics.completedCampaigns }}
                      </dd>
                    </div>
                  </dl>

                  <a
                    rlyButton
                    variant="tertiary"
                    size="sm"
                    class="mt-5"
                    [routerLink]="['/organizaciones', org.slug]"
                  >
                    Ver perfil de {{ org.name }}
                    <rly-icon name="arrow-right" [size]="14" />
                  </a>
                </div>
              }
            </section>
          </div>

          <!-- Panel de decisión -->
          <aside class="hidden lg:block">
            <div class="sticky top-24 rounded-lg border border-border bg-surface p-5">
              <p class="text-ui-sm text-text-muted">Comisión</p>
              <p class="mt-1 text-title-sm text-ink">{{ commission() }}</p>
              <p class="mt-1 text-ui-sm text-text-secondary">
                Sobre {{ item.price | rlyMoney }}{{ priceSuffix() }} · {{ conversionEvent() }}
              </p>

              @if (matchScore() !== null) {
                <div class="mt-5 flex items-center gap-3 border-t border-border pt-5">
                  <rly-match-score [value]="matchScore()!" size="lg" [showLabel]="false" />
                  <div>
                    <p class="text-ui font-medium text-ink">{{ matchScore() }}% de compatibilidad</p>
                    <p class="text-ui-sm text-text-secondary">Según tu perfil y tus canales</p>
                  </div>
                </div>
              }

              <dl class="mt-5 flex flex-col gap-3 border-t border-border pt-5">
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-ui-sm text-text-secondary">Acceso</dt>
                  <dd class="text-ui-sm text-ink">{{ accessLabel() }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-ui-sm text-text-secondary">Atribución</dt>
                  <dd class="text-ui-sm text-ink">{{ attribution() }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-ui-sm text-text-secondary">Duración</dt>
                  <dd class="text-ui-sm text-ink">{{ duration() }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-ui-sm text-text-secondary">Conversión media</dt>
                  <dd class="text-ui-sm tabular-nums text-ink">
                    {{ item.metrics.conversionRate | rlyPercent: 2 }}
                  </dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-ui-sm text-text-secondary">Afiliados activos</dt>
                  <dd class="text-ui-sm tabular-nums text-ink">
                    {{ item.metrics.activeAffiliates | rlyNumber }}
                  </dd>
                </div>
              </dl>

              <div class="mt-5 flex flex-col gap-2 border-t border-border pt-5">
                @if (usesLauncher()) {
                  <button rlyButton variant="primary" block type="button" (click)="startApply()">
                    {{ primaryLabel() }}
                  </button>
                } @else {
                  <a rlyButton variant="primary" block [routerLink]="primaryLink()">
                    {{ primaryLabel() }}
                  </a>
                }

                @if (hasSession()) {
                  <button
                    rlyButton
                    variant="tertiary"
                    block
                    type="button"
                    (click)="saved.toggleCampaign(item.id)"
                  >
                    <rly-icon
                      [name]="saved.isCampaignSaved(item.id) ? 'bookmark-filled' : 'bookmark'"
                      [size]="16"
                    />
                    {{ saved.isCampaignSaved(item.id) ? 'Guardada' : 'Guardar' }}
                  </button>
                }
              </div>
            </div>
          </aside>
        </div>

        <!-- Barra fija en móvil -->
        <div
          class="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-5 py-3
                 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          style="z-index: var(--rly-z-sticky)"
        >
          <div class="flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-ui font-medium text-ink">{{ commission() }}</p>
              <p class="truncate text-ui-sm text-text-secondary">{{ conversionEvent() }}</p>
            </div>

            @if (hasSession()) {
              <button
                rlyButton
                variant="tertiary"
                iconOnly
                type="button"
                [attr.aria-label]="saved.isCampaignSaved(item.id) ? 'Quitar de guardadas' : 'Guardar campaña'"
                (click)="saved.toggleCampaign(item.id)"
              >
                <rly-icon
                  [name]="saved.isCampaignSaved(item.id) ? 'bookmark-filled' : 'bookmark'"
                  [size]="18"
                />
              </button>
            }

            @if (usesLauncher()) {
              <button
                rlyButton
                variant="primary"
                type="button"
                class="shrink-0"
                (click)="startApply()"
              >
                {{ primaryLabel() }}
              </button>
            } @else {
              <a rlyButton variant="primary" [routerLink]="primaryLink()" class="shrink-0">
                {{ primaryLabel() }}
              </a>
            }
          </div>
        </div>
        @if (usesLauncher()) {
          <rly-apply-launcher
            [campaign]="item"
            [eligibility]="eligibility()"
            [organizationName]="organization.value()?.name ?? 'La organización'"
            [reviewTime]="reviewTime()"
          />
        }
      </article>
    }
  `,
})
export class CampaignDetailPage {
  private readonly catalog = inject(CatalogRepository);
  private readonly engagement = inject(EngagementRepository);
  private readonly session = inject(SessionStore);

  protected readonly saved = inject(SavedStore);

  /** El lanzador solo existe cuando la solicitud se resuelve en esta página. */
  private readonly launcher = viewChild(ApplyLauncher);

  /** Llega desde la ruta con `withComponentInputBinding`. */
  readonly slug = input.required<string>();

  protected readonly sections = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'comision', label: 'Comisión' },
    { id: 'requisitos', label: 'Requisitos' },
    { id: 'recursos', label: 'Recursos' },
    { id: 'empresa', label: 'Empresa' },
  ];

  protected readonly campaign = rxResource({
    params: () => this.slug(),
    stream: ({ params }) => this.catalog.campaign(params),
  });

  protected readonly organization = rxResource({
    params: () => this.campaign.value()?.organizationId,
    stream: ({ params }) => this.catalog.organization(params!),
    defaultValue: undefined,
  });

  private readonly applications = rxResource({
    params: () => {
      const affiliateId = this.session.affiliate()?.id;
      const campaignId = this.campaign.value()?.id;
      return affiliateId && campaignId ? { affiliateId, campaignId } : undefined;
    },
    stream: ({ params }) => this.engagement.listApplications(params),
    defaultValue: [],
  });

  protected readonly hasSession = computed(() => this.session.affiliate() !== null);

  protected readonly matchScore = computed(() => {
    const affiliate = this.session.affiliate();
    const campaign = this.campaign.value();
    return affiliate && campaign ? computeMatchScore(affiliate, campaign) : null;
  });

  protected readonly eligibility = computed(() => {
    const affiliate = this.session.affiliate();
    const campaign = this.campaign.value();
    return affiliate && campaign ? evaluateEligibility(affiliate, campaign) : null;
  });

  protected readonly paragraphs = computed(
    () => this.campaign.value()?.description.split('\n\n') ?? [],
  );

  protected readonly commission = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? commissionDetail(campaign) : '';
  });

  protected readonly category = computed(() => {
    const campaign = this.campaign.value();
    if (!campaign) return '';
    return `${categoryLabel(campaign.categoryId)} · ${subcategoryLabel(campaign.categoryId, campaign.subcategoryId)}`;
  });

  protected readonly conversionEvent = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? CONVERSION_EVENT_LABELS[campaign.commission.conversionEvent] : '';
  });

  protected readonly attribution = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? ATTRIBUTION_LABELS[campaign.commission.attributionWindow] : '';
  });

  protected readonly priceSuffix = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? PRICE_UNIT_SUFFIX[campaign.priceUnit] : '';
  });

  protected readonly accessLabel = computed(() => {
    const campaign = this.campaign.value();
    if (!campaign) return '';

    return {
      open: 'Inmediato',
      selective: 'Con aprobación',
      premium: 'Revisión premium',
    }[campaign.access];
  });

  protected readonly duration = computed(() => {
    const campaign = this.campaign.value();
    if (!campaign) return '';

    const { duration } = campaign;
    if (duration.type === 'evergreen') return 'Siempre activa';

    if (duration.startsAt && daysUntil(duration.startsAt) > 0) {
      return `Empieza en ${daysUntil(duration.startsAt)} días`;
    }

    if (duration.endsAt) {
      const remaining = daysUntil(duration.endsAt);
      return remaining > 0 ? `Termina en ${remaining} días` : 'Finalizada';
    }

    return 'Programada';
  });

  /**
   * Acción principal.
   *
   * Sin sesión demo lleva al acceso conservando el destino; con sesión, al
   * flujo de solicitud o al espacio de la campaña si ya está aprobada.
   */
  protected readonly primaryLink = computed(() => {
    const campaign = this.campaign.value();
    if (!campaign) return ['/login'];

    if (!this.hasSession()) return ['/login'];

    const application = this.applications.value().find((item) => item.status !== 'withdrawn');
    if (application?.status === 'approved') {
      return ['/app/affiliate/campanas', campaign.id];
    }
    if (application) {
      return ['/app/affiliate/aplicaciones', application.id];
    }

    return ['/app/affiliate/campanas', campaign.slug, 'aplicar'];
  });

  protected readonly primaryLabel = computed(() => {
    if (!this.hasSession()) return 'Entrar para aplicar';

    const application = this.applications.value().find((item) => item.status !== 'withdrawn');
    if (application?.status === 'approved') return 'Ir a la campaña';
    if (application) return 'Ver solicitud';

    const eligibility = this.eligibility();
    if (eligibility && !eligibility.eligible) return 'Ver qué me falta';

    return this.campaign.value()?.access === 'open' ? 'Unirme ahora' : 'Aplicar';
  });

  /**
   * Solicitud resuelta en la propia página.
   *
   * Las campañas abiertas y selectivas se resuelven aquí —modal y panel— porque
   * la decisión ya está tomada al llegar. Las premium van a una página aparte:
   * la propuesta es más larga y no cabe en un panel sin comprimirla.
   */
  protected readonly usesLauncher = computed(() => {
    if (!this.hasSession()) return false;

    const campaign = this.campaign.value();
    if (!campaign || campaign.access === 'premium') return false;
    if (this.applications.value().some((item) => item.status !== 'withdrawn')) return false;

    return this.eligibility()?.eligible === true;
  });

  protected readonly reviewTime = computed(() => {
    const days = this.organization.value()?.metrics.averageReviewDays;
    if (!days) return 'unos días';
    return days < 1 ? 'menos de un día' : `${days} días`;
  });

  protected startApply(): void {
    this.launcher()?.open();
  }

  protected tagLabel(tag: string): string {
    return TAG_LABELS[tag as keyof typeof TAG_LABELS] ?? tag;
  }

  protected channelName(channel: string): string {
    return channelLabel(channel as never);
  }

  protected resourceIcon(kind: string) {
    return (
      { image: 'image', copy: 'copy', guide: 'book-open', link: 'external-link' } as const
    )[kind as 'image' | 'copy' | 'guide' | 'link'];
  }
}
