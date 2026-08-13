import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Button } from '@ds/button/button';
import { Drawer } from '@ds/drawer/drawer';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Pagination } from '@ds/pagination/pagination';
import { Skeleton } from '@ds/skeleton/skeleton';
import { SessionStore } from '@core/session/session.store';
import { SavedStore } from '@core/session/saved.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { Campaign } from '@data/models/campaign';
import { computeMatchScore, evaluateEligibility } from '@data/logic/matching';
import { CampaignCard, CampaignRelation } from '@domain/campaign-card/campaign-card';
import { FilterBar, QuickFilter } from '@domain/filter-bar/filter-bar';
import { NumberPipe } from '@shared/pipes/format.pipes';
import { MarketplaceFilterPanel } from './marketplace-filter-panel';
import {
  activeFilterCount,
  CampaignSort,
  EMPTY_FILTERS,
  hasAnyFilter,
  MarketplaceFilters,
  parseFilters,
  SORT_OPTIONS,
  toQueryParams,
  toRequestParams,
} from './marketplace-filters';

const PAGE_SIZE = 12;

/**
 * Marketplace.
 *
 * Es la misma vista con y sin sesión demo: lo que cambia es la información que
 * se puede calcular. Con perfil aparecen el match, la elegibilidad y el estado
 * de cada campaña; sin él, la tarjeta se limita a los datos públicos y las
 * acciones que requieren cuenta llevan al acceso demo.
 *
 * Los filtros viven en la URL, de modo que una búsqueda se puede compartir y
 * el botón «atrás» del navegador funciona como se espera.
 */
@Component({
  selector: 'rly-marketplace-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    Drawer,
    EmptyState,
    Icon,
    Pagination,
    Skeleton,
    CampaignCard,
    FilterBar,
    MarketplaceFilterPanel,
    NumberPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="container-page py-8 lg:py-12">
      <header class="max-w-2xl">
        <p class="text-label uppercase text-text-muted">Marketplace</p>
        <h1 class="mt-2 text-title-lg text-ink">
          Oportunidades de afiliación para servicios, productos y suscripciones
        </h1>
        <p class="mt-3 text-body-lg text-text-secondary">
          Filtra por categoría, comisión y modalidad de acceso. Cada campaña indica qué conversión
          paga, cuánto y en qué condiciones.
        </p>
      </header>

      <div class="mt-8">
        <rly-filter-bar
          [query]="filters().q"
          searchLabel="Buscar campañas"
          searchPlaceholder="Buscar por campaña u organización"
          [quickFilters]="quickFilters()"
          [sortOptions]="sortOptions"
          [sort]="filters().sort"
          [activeCount]="activeCount()"
          [hasSession]="hasSession()"
          (queryChanged)="setQuery($event)"
          (sortChanged)="setSort($event)"
          (quickFilterToggled)="toggleQuickFilter($event)"
          (moreRequested)="panelOpen.set(true)"
        />
      </div>

      @if (featured(); as campaign) {
        <section class="mt-10" aria-labelledby="destacada">
          <h2 id="destacada" class="text-title-xs text-ink">Campaña destacada</h2>
          <rly-campaign-card
            class="mt-4"
            variant="featured"
            [campaign]="campaign"
            [organization]="organizationFor(campaign)"
            [matchScore]="matchFor(campaign)"
            [relation]="relationFor(campaign)"
            [saved]="saved.isCampaignSaved(campaign.id)"
            [showSave]="hasSession()"
            (saveToggled)="saved.toggleCampaign(campaign.id)"
          />
        </section>
      }

      @if (recommendations().length) {
        <section class="mt-10" aria-labelledby="recomendadas">
          <h2 id="recomendadas" class="text-title-xs text-ink">Recomendadas para ti</h2>
          <p class="mt-1 text-ui-sm text-text-secondary">
            Campañas para las que calificas, ordenadas por compatibilidad con tu perfil.
          </p>

          <ul class="mt-4 flex flex-col gap-3">
            @for (campaign of recommendations(); track campaign.id) {
              <li>
                <rly-campaign-card
                  variant="horizontal"
                  [campaign]="campaign"
                  [organization]="organizationFor(campaign)"
                  [matchScore]="matchFor(campaign)"
                  [relation]="relationFor(campaign)"
                  [saved]="saved.isCampaignSaved(campaign.id)"
                  (saveToggled)="saved.toggleCampaign(campaign.id)"
                />
              </li>
            }
          </ul>
        </section>
      }

      <section class="mt-10" aria-labelledby="resultados">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="resultados" class="text-title-xs text-ink">
            {{ hasFilters() ? 'Resultados' : 'Todas las campañas' }}
          </h2>

          @if (page.hasValue() && !page.isLoading()) {
            <p class="text-ui-sm text-text-secondary" aria-live="polite">
              <span class="tabular-nums">{{ total() | rlyNumber }}</span>
              {{ total() === 1 ? 'campaña' : 'campañas' }}
            </p>
          }
        </div>

        @if (page.isLoading()) {
          <div class="grid-cards mt-5" aria-hidden="true">
            @for (placeholder of placeholders; track placeholder) {
              <div class="overflow-hidden rounded-lg border border-border bg-surface">
                <rly-skeleton shape="block" height="9.5rem" />
                <div class="flex flex-col gap-2.5 p-4">
                  <rly-skeleton width="45%" />
                  <rly-skeleton width="80%" height="1.125rem" />
                  <rly-skeleton width="60%" />
                </div>
              </div>
            }
          </div>
          <p class="sr-only" aria-live="polite">Cargando campañas</p>
        } @else if (page.error()) {
          <div class="mt-5 rounded-lg border border-border bg-surface">
            <rly-empty-state
              icon="alert"
              title="No se pudieron cargar las campañas"
              description="Ha fallado la petición al catálogo. Puedes intentarlo de nuevo."
            >
              <button rlyButton variant="primary" type="button" (click)="page.reload()">
                Reintentar
              </button>
            </rly-empty-state>
          </div>
        } @else if (!results().length) {
          <div class="mt-5 rounded-lg border border-border bg-surface">
            <rly-empty-state
              icon="search"
              title="Ninguna campaña coincide con estos filtros"
              description="Prueba a quitar algún filtro o a ampliar la categoría."
            >
              <button rlyButton variant="tertiary" type="button" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </rly-empty-state>
          </div>
        } @else {
          <div class="grid-cards mt-5">
            @for (campaign of results(); track campaign.id) {
              <rly-campaign-card
                [campaign]="campaign"
                [organization]="organizationFor(campaign)"
                [matchScore]="matchFor(campaign)"
                [relation]="relationFor(campaign)"
                [saved]="saved.isCampaignSaved(campaign.id)"
                [showSave]="hasSession()"
                (saveToggled)="saved.toggleCampaign(campaign.id)"
              />
            }
          </div>

          @if (total() > pageSize) {
            <rly-pagination
              class="mt-8"
              [page]="filters().page"
              [pageSize]="pageSize"
              [total]="total()"
              ariaLabel="Paginación de campañas"
              (pageChange)="setPage($event)"
            />
          }
        }
      </section>

      @if (!hasSession()) {
        <aside class="mt-12 overflow-hidden rounded-lg bg-inverse p-6 sm:p-8">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="max-w-lg">
              <h2 class="text-title-sm text-text-inverse">
                Entra en la demo para ver tu compatibilidad
              </h2>
              <p class="mt-2 text-ui text-text-inverse-secondary">
                Con un perfil activo, cada campaña muestra tu match, los requisitos que cumples y el
                estado de tu solicitud.
              </p>
            </div>

            <a rlyButton variant="primary" onInverse routerLink="/login" class="shrink-0">
              Ver demo como afiliado
              <rly-icon name="arrow-right" [size]="16" />
            </a>
          </div>
        </aside>
      }
    </div>

    <rly-drawer [open]="panelOpen()" title="Filtros" (closed)="panelOpen.set(false)">
      <rly-marketplace-filter-panel
        [filters]="filters()"
        [hasSession]="hasSession()"
        (filtersChanged)="applyFilters($event)"
      />

      <button drawerFooter rlyButton variant="ghost" class="flex-1" (click)="clearFilters()">
        Limpiar
      </button>
      <button
        drawerFooter
        rlyButton
        variant="primary"
        class="flex-1"
        (click)="panelOpen.set(false)"
      >
        Ver {{ total() | rlyNumber }} resultados
      </button>
    </rly-drawer>
  `,
})
export class MarketplacePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogRepository);
  private readonly engagement = inject(EngagementRepository);
  private readonly session = inject(SessionStore);

  protected readonly saved = inject(SavedStore);
  protected readonly pageSize = PAGE_SIZE;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly placeholders = Array.from({ length: 6 }, (_, index) => index);
  protected readonly panelOpen = signal(false);

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  protected readonly filters = computed(() => parseFilters(this.queryParams()));
  protected readonly activeCount = computed(() => activeFilterCount(this.filters()));
  protected readonly hasFilters = computed(() => hasAnyFilter(this.filters()));

  protected readonly affiliate = this.session.affiliate;
  protected readonly hasSession = computed(() => this.affiliate() !== null);

  /** Catálogo de organizaciones: la tarjeta necesita el nombre del emisor. */
  private readonly organizations = rxResource({
    stream: () => this.catalog.listOrganizations(),
    defaultValue: [],
  });

  protected readonly page = rxResource({
    params: () => ({ filters: this.filters(), affiliateId: this.affiliate()?.id ?? null }),
    stream: ({ params }) =>
      this.catalog.listCampaigns(
        toRequestParams(params.filters, params.affiliateId, PAGE_SIZE),
      ),
  });

  /** Solicitudes del afiliado, para saber el estado de cada tarjeta. */
  private readonly applications = rxResource({
    params: () => this.affiliate()?.id ?? null,
    stream: ({ params }) =>
      params
        ? this.engagement.listApplications({ affiliateId: params })
        : this.engagement.listApplications({ affiliateId: '__none__' }),
    defaultValue: [],
  });

  protected readonly results = computed(() => this.page.value()?.items ?? []);
  protected readonly total = computed(() => this.page.value()?.total ?? 0);

  /**
   * La campaña destacada solo aparece en la vista sin filtrar: cuando alguien
   * está buscando algo concreto, un bloque grande por encima estorba.
   */
  protected readonly featured = computed<Campaign | null>(() => {
    if (this.hasFilters() || this.filters().page > 1) return null;
    return this.results()[0] ?? null;
  });

  /**
   * Recomendaciones.
   *
   * Solo con perfil en contexto y solo en la vista sin filtrar. Son las
   * campañas para las que la persona califica y a las que todavía no ha
   * solicitado, ordenadas por compatibilidad: recomendar algo que ya se
   * solicitó o para lo que no se califica no ayuda a decidir.
   */
  protected readonly recommendations = computed<readonly Campaign[]>(() => {
    const affiliate = this.affiliate();
    if (!affiliate || this.hasFilters() || this.filters().page > 1) return [];

    const featuredId = this.featured()?.id;

    return this.results()
      .filter((campaign) => campaign.id !== featuredId)
      .filter((campaign) => this.relationFor(campaign) === 'eligible')
      .map((campaign) => ({ campaign, score: computeMatchScore(affiliate, campaign) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.campaign);
  });

  constructor() {
    void this.saved.load();
  }

  protected organizationFor(campaign: Campaign) {
    return this.organizations.value().find((item) => item.id === campaign.organizationId) ?? null;
  }

  protected matchFor(campaign: Campaign): number | null {
    const affiliate = this.affiliate();
    return affiliate ? computeMatchScore(affiliate, campaign) : null;
  }

  protected relationFor(campaign: Campaign): CampaignRelation {
    const affiliate = this.affiliate();
    if (!affiliate) return 'none';

    const application = this.applications.value()
      .filter((item) => item.campaignId === campaign.id)
      .find((item) => item.status !== 'withdrawn');

    if (application?.status === 'approved') return 'approved';
    if (application && application.status !== 'rejected') return 'applied';

    return evaluateEligibility(affiliate, campaign).eligible ? 'eligible' : 'not-eligible';
  }

  protected readonly quickFilters = computed<QuickFilter[]>(() => {
    const filters = this.filters();

    return [
      {
        id: 'eligible',
        label: 'Solo las que califico',
        icon: 'check-circle',
        active: filters.eligible,
        requiresSession: true,
      },
      {
        id: 'match',
        label: 'Match sobre 80%',
        icon: 'target',
        active: filters.minMatch >= 80,
        requiresSession: true,
      },
      {
        id: 'open',
        label: 'Aceptación inmediata',
        icon: 'zap',
        active: filters.access.includes('open'),
      },
      {
        id: 'recurring',
        label: 'Comisión recurrente',
        icon: 'refresh',
        active: filters.commissionModels.includes('recurring'),
      },
      {
        id: 'saved',
        label: 'Guardadas',
        icon: 'bookmark',
        active: filters.saved,
        requiresSession: true,
      },
      {
        id: 'new',
        label: 'Nuevas esta semana',
        icon: 'star',
        active: filters.newThisWeek,
      },
    ];
  });

  protected toggleQuickFilter(id: string): void {
    const filters = this.filters();

    switch (id) {
      case 'eligible':
        return this.applyFilters({ ...filters, eligible: !filters.eligible });
      case 'match':
        return this.applyFilters({ ...filters, minMatch: filters.minMatch >= 80 ? 0 : 80 });
      case 'open':
        return this.applyFilters({
          ...filters,
          access: filters.access.includes('open')
            ? filters.access.filter((value) => value !== 'open')
            : [...filters.access, 'open'],
        });
      case 'recurring':
        return this.applyFilters({
          ...filters,
          commissionModels: filters.commissionModels.includes('recurring')
            ? filters.commissionModels.filter((value) => value !== 'recurring')
            : [...filters.commissionModels, 'recurring'],
        });
      case 'saved':
        return this.applyFilters({ ...filters, saved: !filters.saved });
      case 'new':
        return this.applyFilters({ ...filters, newThisWeek: !filters.newThisWeek });
    }
  }

  protected setQuery(q: string): void {
    this.applyFilters({ ...this.filters(), q });
  }

  protected setSort(sort: string): void {
    this.applyFilters({ ...this.filters(), sort: sort as CampaignSort });
  }

  protected setPage(page: number): void {
    this.applyFilters({ ...this.filters(), page }, false);
  }

  protected clearFilters(): void {
    this.applyFilters(EMPTY_FILTERS);
  }

  /** Cambiar un filtro devuelve siempre a la primera página de resultados. */
  protected applyFilters(filters: MarketplaceFilters, resetPage = true): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams(resetPage ? { ...filters, page: 1 } : filters),
      replaceUrl: true,
    });
  }
}
