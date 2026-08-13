import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { SessionStore } from '@core/session/session.store';
import { SavedStore } from '@core/session/saved.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import {
  ACCESS_LABELS,
  ATTRIBUTION_LABELS,
  Campaign,
  CONVERSION_EVENT_LABELS,
} from '@data/models/campaign';
import { channelLabel } from '@data/models/taxonomy';
import { commissionDetail, estimateEarnings } from '@data/logic/commission';
import { computeMatchScore, evaluateEligibility } from '@data/logic/matching';
import { MatchScore } from '@domain/match-score/match-score';
import { formatCurrency, formatPercent } from '@shared/utils/format';

interface CompareRow {
  readonly label: string;
  readonly values: readonly string[];
  /** Resalta la columna con mejor valor cuando la comparación es numérica. */
  readonly best?: number;
  readonly hint?: string;
}

/**
 * Comparación de campañas.
 *
 * Dos o tres columnas, nunca más: a partir de ahí la tabla deja de caber y la
 * comparación deja de ser útil. Las filas numéricas señalan la mejor opción,
 * porque comparar sin resolver quién gana obliga a hacer el trabajo dos veces.
 */
@Component({
  selector: 'rly-compare-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, EmptyState, Icon, MatchScore],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Comparar campañas</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Las condiciones de cada campaña, una al lado de la otra.
          </p>
        </div>

        <a rlyButton variant="tertiary" routerLink="/app/affiliate/guardadas">
          Cambiar selección
        </a>
      </header>

      @if (!campaigns().length) {
        <div class="mt-6 rounded-lg border border-border bg-surface">
          <rly-empty-state
            icon="compare"
            title="No hay campañas para comparar"
            description="Elige dos o tres campañas guardadas y aparecerán aquí una junto a otra."
          >
            <a rlyButton variant="primary" routerLink="/app/affiliate/guardadas">
              Ir a guardadas
            </a>
          </rly-empty-state>
        </div>
      } @else {
        <!-- Cabecera de columnas -->
        <div class="scrollbar-none mt-6 overflow-x-auto">
          <div class="min-w-[42rem]">
            <div [class]="gridClasses()">
              <div class="hidden lg:block"></div>

              @for (campaign of campaigns(); track campaign.id) {
                <div class="rounded-t-lg border border-b-0 border-border bg-surface p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-ui-sm text-text-secondary">
                        {{ organizationName(campaign) }}
                      </p>
                      <h3 class="mt-0.5 truncate text-title-xs text-ink">{{ campaign.name }}</h3>
                    </div>

                    <button
                      type="button"
                      class="focus-ring -m-1 shrink-0 rounded-sm p-1 text-text-muted
                             transition-colors hover:text-ink"
                      [attr.aria-label]="'Quitar ' + campaign.name + ' de la comparación'"
                      (click)="saved.toggleCompare(campaign.id)"
                    >
                      <rly-icon name="close" [size]="16" />
                    </button>
                  </div>

                  @if (matchFor(campaign) !== null) {
                    <rly-match-score class="mt-3" [value]="matchFor(campaign)!" size="sm" />
                  }
                </div>
              }
            </div>

            <!-- Filas -->
            @for (row of rows(); track row.label; let last = $last) {
              <div [class]="gridClasses()">
                <div
                  class="flex items-center border-x border-t border-border bg-canvas px-4 py-3
                         text-ui-sm text-text-secondary lg:border-l-0"
                  [class.rounded-bl-lg]="last"
                  [class.border-b]="last"
                >
                  <span>
                    {{ row.label }}
                    @if (row.hint) {
                      <span class="block text-ui-sm text-text-muted">{{ row.hint }}</span>
                    }
                  </span>
                </div>

                @for (value of row.values; track $index; let column = $index) {
                  <div
                    class="border-x border-t border-border bg-surface px-4 py-3 text-ui"
                    [class.border-b]="last"
                    [class.rounded-br-lg]="last && column === row.values.length - 1"
                    [class.font-medium]="row.best === column"
                    [class.text-ink]="row.best === column"
                    [class.text-text-secondary]="row.best !== column"
                  >
                    <span class="flex items-center gap-1.5">
                      {{ value }}
                      @if (row.best === column) {
                        <rly-icon name="check-circle" [size]="14" class="text-success" />
                        <span class="sr-only">Mejor opción</span>
                      }
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Acciones por campaña -->
        <div [class]="gridClasses()" class="mt-4">
          <div class="hidden lg:block"></div>
          @for (campaign of campaigns(); track campaign.id) {
            <a rlyButton variant="primary" block [routerLink]="['/campanas', campaign.slug]">
              Ver {{ campaign.name }}
            </a>
          }
        </div>

        <p class="mt-6 text-ui-sm text-text-muted">
          La estimación de ingresos asume cinco conversiones al mes e incluye el bono cuando la
          campaña lo alcanza a ese volumen.
        </p>
      }
    </div>
  `,
})
export class ComparePage {
  private readonly session = inject(SessionStore);
  private readonly catalog = inject(CatalogRepository);

  protected readonly saved = inject(SavedStore);

  private readonly catalogResource = rxResource({
    stream: () => this.catalog.listCampaigns({ pageSize: 50, includeAll: true }),
  });

  private readonly organizations = rxResource({
    stream: () => this.catalog.listOrganizations(),
    defaultValue: [],
  });

  protected readonly campaigns = computed(() => {
    const ids = this.saved.comparedCampaigns();
    const all = this.catalogResource.value()?.items ?? [];

    return ids
      .map((id) => all.find((campaign) => campaign.id === id))
      .filter((campaign): campaign is Campaign => campaign !== undefined);
  });

  /**
   * Las clases se eligen de un mapa cerrado y no se componen con plantillas:
   * Tailwind escanea el código fuente en build y no vería una clase construida
   * en tiempo de ejecución.
   */
  protected readonly gridClasses = computed(
    () =>
      ({
        1: 'grid grid-cols-1 lg:grid-cols-[12rem_minmax(0,1fr)]',
        2: 'grid grid-cols-2 lg:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)]',
        3: 'grid grid-cols-3 lg:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]',
      })[Math.min(3, Math.max(1, this.campaigns().length)) as 1 | 2 | 3],
  );

  /**
   * Filas de la tabla.
   *
   * Se calculan juntas para poder decidir cuál es la mejor columna de cada
   * fila numérica: es una comparación entre campañas, no un dato aislado.
   */
  protected readonly rows = computed<CompareRow[]>(() => {
    const campaigns = this.campaigns();
    if (!campaigns.length) return [];

    const affiliate = this.session.affiliate();

    const estimates = campaigns.map((campaign) => estimateEarnings(campaign, 5).total);
    const matches = campaigns.map((campaign) =>
      affiliate ? computeMatchScore(affiliate, campaign) : 0,
    );
    const rates = campaigns.map((campaign) => campaign.metrics.conversionRate);
    const requirements = campaigns.map((campaign) =>
      affiliate ? evaluateEligibility(affiliate, campaign) : null,
    );

    return [
      {
        label: 'Comisión',
        values: campaigns.map((campaign) => commissionDetail(campaign)),
      },
      {
        label: 'Ingreso estimado',
        hint: 'con 5 conversiones',
        values: estimates.map((value) => formatCurrency(value)),
        best: indexOfMax(estimates),
      },
      {
        label: 'Conversión que paga',
        values: campaigns.map(
          (campaign) => CONVERSION_EVENT_LABELS[campaign.commission.conversionEvent],
        ),
      },
      {
        label: 'Precio de la oferta',
        values: campaigns.map((campaign) => formatCurrency(campaign.price)),
      },
      {
        label: 'Acceso',
        values: campaigns.map((campaign) => ACCESS_LABELS[campaign.access]),
      },
      {
        label: 'Atribución',
        values: campaigns.map(
          (campaign) => ATTRIBUTION_LABELS[campaign.commission.attributionWindow],
        ),
      },
      {
        label: 'Duración',
        values: campaigns.map((campaign) =>
          campaign.duration.type === 'evergreen' ? 'Siempre activa' : 'Con fecha de cierre',
        ),
      },
      {
        label: 'Compatibilidad',
        values: matches.map((value) => `${value}%`),
        best: affiliate ? indexOfMax(matches) : undefined,
      },
      {
        label: 'Requisitos que cumples',
        values: requirements.map((result) =>
          result ? `${result.metCount} de ${result.total}` : '—',
        ),
      },
      {
        label: 'Conversión media',
        values: rates.map((value) => formatPercent(value, 2)),
        best: indexOfMax(rates),
      },
      {
        label: 'Canales permitidos',
        values: campaigns.map((campaign) =>
          campaign.channels.map((channel) => channelLabel(channel)).join(', '),
        ),
      },
    ];
  });

  protected organizationName(campaign: Campaign): string {
    return (
      this.organizations.value().find((item) => item.id === campaign.organizationId)?.name ?? ''
    );
  }

  protected matchFor(campaign: Campaign): number | null {
    const affiliate = this.session.affiliate();
    return affiliate ? computeMatchScore(affiliate, campaign) : null;
  }
}

function indexOfMax(values: readonly number[]): number | undefined {
  if (!values.length) return undefined;

  const max = Math.max(...values);
  // Si hay empate no se marca ninguna: señalar una arbitrariamente sería mentir.
  return values.filter((value) => value === max).length > 1 ? undefined : values.indexOf(max);
}
