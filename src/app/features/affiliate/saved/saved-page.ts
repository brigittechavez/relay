import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { SessionStore } from '@core/session/session.store';
import { SavedStore } from '@core/session/saved.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { Campaign } from '@data/models/campaign';
import { computeMatchScore, evaluateEligibility } from '@data/logic/matching';
import { CampaignCard, CampaignRelation } from '@domain/campaign-card/campaign-card';

/**
 * Campañas guardadas.
 *
 * La lista es la antesala de la comparación: desde aquí se eligen las dos o
 * tres que se van a comparar en detalle. El selector de comparación vive en
 * cada tarjeta y no en una barra aparte, para que la elección ocurra donde se
 * está mirando.
 */
@Component({
  selector: 'rly-saved-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, EmptyState, Icon, Skeleton, CampaignCard],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Guardadas</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Campañas que has marcado para decidir después.
          </p>
        </div>

        @if (saved.compareCount() > 0) {
          <a rlyButton variant="primary" routerLink="/app/affiliate/comparar">
            Comparar {{ saved.compareCount() }}
            <rly-icon name="arrow-right" [size]="16" />
          </a>
        }
      </header>

      @if (campaigns.isLoading()) {
        <div class="grid-cards mt-6">
          @for (item of [1, 2, 3]; track item) {
            <rly-skeleton shape="block" height="18rem" />
          }
        </div>
      } @else if (!items().length) {
        <div class="mt-6 rounded-lg border border-border bg-surface">
          <rly-empty-state
            icon="bookmark"
            title="Todavía no has guardado campañas"
            description="Guarda las oportunidades que te interesen para volver a ellas y compararlas."
          >
            <a rlyButton variant="primary" routerLink="/app/affiliate/marketplace">
              Explorar el marketplace
            </a>
          </rly-empty-state>
        </div>
      } @else {
        <div class="grid-cards mt-6">
          @for (campaign of items(); track campaign.id) {
            <div class="flex flex-col gap-2">
              <rly-campaign-card
                [campaign]="campaign"
                [organization]="organizationFor(campaign)"
                [matchScore]="matchFor(campaign)"
                [relation]="relationFor(campaign)"
                saved
                (saveToggled)="saved.toggleCampaign(campaign.id)"
              />

              <button
                type="button"
                [class]="compareClasses(campaign.id)"
                [attr.aria-pressed]="saved.isCompared(campaign.id)"
                (click)="saved.toggleCompare(campaign.id)"
              >
                <rly-icon
                  [name]="saved.isCompared(campaign.id) ? 'check' : 'compare'"
                  [size]="15"
                />
                {{ saved.isCompared(campaign.id) ? 'En la comparación' : 'Añadir a comparar' }}
              </button>
            </div>
          }
        </div>

        <p class="mt-6 text-ui-sm text-text-muted">Puedes comparar hasta tres campañas a la vez.</p>
      }
    </div>
  `,
})
export class SavedPage {
  private readonly session = inject(SessionStore);
  private readonly catalog = inject(CatalogRepository);

  protected readonly saved = inject(SavedStore);

  protected readonly campaigns = rxResource({
    stream: () => this.catalog.listCampaigns({ pageSize: 50, includeAll: true }),
  });

  private readonly organizations = rxResource({
    stream: () => this.catalog.listOrganizations(),
    defaultValue: [],
  });

  protected readonly items = computed(() => {
    const ids = new Set(this.saved.savedCampaigns());
    return (this.campaigns.value()?.items ?? []).filter((campaign) => ids.has(campaign.id));
  });

  protected organizationFor(campaign: Campaign) {
    return this.organizations.value().find((item) => item.id === campaign.organizationId) ?? null;
  }

  protected matchFor(campaign: Campaign): number | null {
    const affiliate = this.session.affiliate();
    return affiliate ? computeMatchScore(affiliate, campaign) : null;
  }

  protected relationFor(campaign: Campaign): CampaignRelation {
    const affiliate = this.session.affiliate();
    if (!affiliate) return 'none';

    return evaluateEligibility(affiliate, campaign).eligible ? 'eligible' : 'not-eligible';
  }

  protected compareClasses(id: string): string {
    return [
      'focus-ring flex items-center justify-center gap-2 rounded-md border py-2 text-ui-sm',
      'font-medium transition-colors duration-micro',
      this.saved.isCompared(id)
        ? 'border-ink bg-ink text-text-inverse'
        : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-ink',
    ].join(' ');
  }
}
