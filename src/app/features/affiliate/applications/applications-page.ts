import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { ApplicationStatus } from '@data/models/application';
import { MatchScore } from '@domain/match-score/match-score';
import { ApplicationStatusBadge } from '@domain/status/status-badges';
import { RelativeDatePipe } from '@shared/pipes/format.pipes';

type Filter = 'all' | 'pending' | 'approved' | 'closed';

const GROUPS: Record<Filter, readonly ApplicationStatus[]> = {
  all: [],
  pending: ['submitted', 'under-review', 'info-requested'],
  approved: ['approved'],
  closed: ['rejected', 'withdrawn'],
};

/**
 * Solicitudes del afiliado.
 *
 * Lista en formato de filas y no tabla: son cinco datos por solicitud y una
 * tabla obligaría a comprimirlos o a hacer scroll horizontal en móvil, que es
 * justo lo que hay que evitar.
 */
@Component({
  selector: 'rly-applications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    Chip,
    EmptyState,
    Icon,
    Skeleton,
    MatchScore,
    ApplicationStatusBadge,
    RelativeDatePipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header>
        <h2 class="text-title-md text-ink">Mis solicitudes</h2>
        <p class="mt-1 text-ui text-text-secondary">
          Estado de cada campaña a la que has solicitado acceso.
        </p>
      </header>

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

      @if (applications.isLoading()) {
        <div class="mt-6 flex flex-col gap-2">
          @for (item of [1, 2, 3]; track item) {
            <rly-skeleton shape="block" height="5.5rem" />
          }
        </div>
      } @else if (!visible().length) {
        <div class="mt-6 rounded-lg border border-border bg-surface">
          <rly-empty-state
            icon="applications"
            [title]="emptyTitle()"
            [description]="emptyDescription()"
          >
            <a rlyButton variant="primary" routerLink="/app/affiliate/marketplace">
              Explorar campañas
            </a>
          </rly-empty-state>
        </div>
      } @else {
        <ul class="mt-6 flex flex-col gap-2">
          @for (application of visible(); track application.id) {
            <li>
              <a
                [routerLink]="['/app/affiliate/aplicaciones', application.id]"
                class="focus-ring flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-3 rounded-lg border
                       border-border bg-surface p-4 transition-colors duration-micro
                       hover:border-border-strong"
              >
                <rly-match-score [value]="application.matchScore" size="sm" [showLabel]="false" />

                <span class="min-w-0 flex-1">
                  <span class="block truncate text-ui font-medium text-ink">
                    {{ campaignName(application.campaignId) }}
                  </span>
                  <span class="block truncate text-ui-sm text-text-secondary">
                    {{ organizationName(application.organizationId) }}
                  </span>
                </span>

                <rly-application-status [status]="application.status" />

                <span class="sm:w-24 text-ui-sm text-text-muted">
                  {{ application.submittedAt ?? application.createdAt | rlyRelativeDate }}
                </span>

                <rly-icon name="chevron-right" [size]="16" class="text-text-muted max-sm:hidden" />
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class ApplicationsPage {
  private readonly session = inject(SessionStore);
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);

  protected readonly filter = signal<Filter>('all');

  protected readonly filters: readonly { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'En revisión' },
    { id: 'approved', label: 'Aprobadas' },
    { id: 'closed', label: 'Cerradas' },
  ];

  protected readonly applications = rxResource({
    params: () => this.session.affiliate()?.id,
    stream: ({ params }) => this.engagement.listApplications({ affiliateId: params }),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    stream: () => this.catalog.listCampaigns({ pageSize: 50, includeAll: true }),
  });

  private readonly organizations = rxResource({
    stream: () => this.catalog.listOrganizations(),
    defaultValue: [],
  });

  protected readonly visible = computed(() => {
    const statuses = GROUPS[this.filter()];
    const items = this.applications.value();

    return statuses.length ? items.filter((item) => statuses.includes(item.status)) : items;
  });

  protected countFor(filter: Filter): number | null {
    const statuses = GROUPS[filter];
    if (!statuses.length) return this.applications.value().length;

    const count = this.applications.value().filter((item) => statuses.includes(item.status)).length;
    return count || null;
  }

  protected readonly emptyTitle = computed(() =>
    this.filter() === 'all'
      ? 'Todavía no has solicitado ninguna campaña'
      : 'Ninguna solicitud en este estado',
  );

  protected readonly emptyDescription = computed(() =>
    this.filter() === 'all'
      ? 'Cuando encuentres una campaña que encaje, tu solicitud aparecerá aquí con su estado.'
      : 'Prueba con otro filtro para ver el resto de tus solicitudes.',
  );

  protected campaignName(campaignId: string): string {
    return (
      (this.campaigns.value()?.items ?? []).find((campaign) => campaign.id === campaignId)?.name ??
      campaignId
    );
  }

  protected organizationName(organizationId: string): string {
    return (
      this.organizations.value().find((item) => item.id === organizationId)?.name ?? organizationId
    );
  }
}
