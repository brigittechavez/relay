import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { Application, PENDING_REVIEW } from '@data/models/application';
import { DEMO_TODAY } from '@data/seed/demo-clock';
import { MatchScore } from '@domain/match-score/match-score';
import { ApplicationStatusBadge } from '@domain/status/status-badges';
import { csvFilename, downloadCsv, toCsv } from '@shared/utils/csv';
import { RelativeDatePipe } from '@shared/pipes/format.pipes';
import { ApplicationReview } from './application-review';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

/**
 * Bandeja de solicitudes de la organización.
 *
 * Abre por defecto en «Por revisar»: es lo único de esta pantalla que requiere
 * una acción. La revisión ocurre en un panel lateral para no perder el sitio en
 * la lista al decidir una tras otra.
 */
@Component({
  selector: 'rly-organization-applications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    Chip,
    EmptyState,
    Icon,
    Skeleton,
    MatchScore,
    ApplicationStatusBadge,
    ApplicationReview,
    RelativeDatePipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-title-md text-ink">Solicitudes</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Quién quiere promocionar tus campañas y con qué propuesta.
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
            <rly-skeleton shape="block" height="6rem" />
          }
        </div>
      } @else if (!visible().length) {
        <div class="mt-6 rounded-lg border border-border bg-surface">
          <rly-empty-state
            icon="applications"
            [title]="emptyTitle()"
            [description]="emptyDescription()"
          />
        </div>
      } @else {
        <ul class="mt-6 flex flex-col gap-2">
          @for (application of visible(); track application.id) {
            <li>
              <button
                type="button"
                class="focus-ring flex w-full flex-wrap items-center gap-x-5 gap-y-3 rounded-lg
                       border border-border bg-surface p-4 text-left transition-colors
                       duration-micro hover:border-border-strong"
                (click)="review(application)"
              >
                <rly-match-score [value]="application.matchScore" size="sm" [showLabel]="false" />

                <span class="min-w-0 flex-1">
                  <span class="block truncate text-ui font-medium text-ink">
                    {{ affiliateName(application.affiliateId) }}
                  </span>
                  <span class="block truncate text-ui-sm text-text-secondary">
                    {{ campaignName(application.campaignId) }}
                  </span>
                </span>

                <rly-application-status [status]="application.status" />

                <span class="w-24 text-ui-sm text-text-muted">
                  {{ application.submittedAt ?? application.createdAt | rlyRelativeDate }}
                </span>

                <rly-icon name="chevron-right" [size]="16" class="text-text-muted" />
              </button>
            </li>
          }
        </ul>
      }
    </div>

    <rly-application-review
      [open]="selected() !== null"
      [application]="selected()"
      [affiliate]="selectedAffiliate()"
      [campaign]="selectedCampaign()"
      (closed)="selected.set(null)"
      (decided)="onDecided()"
    />
  `,
})
export class OrganizationApplicationsPage {
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);

  readonly organizationId = input.required<string>();

  /** Filtra por campaña cuando se llega desde el detalle de una. */
  readonly campaignId = input<string | undefined>(undefined);

  protected readonly filter = signal<Filter>('pending');
  protected readonly selected = signal<Application | null>(null);

  protected readonly filters: readonly { id: Filter; label: string }[] = [
    { id: 'pending', label: 'Por revisar' },
    { id: 'approved', label: 'Aprobadas' },
    { id: 'rejected', label: 'Rechazadas' },
    { id: 'all', label: 'Todas' },
  ];

  protected readonly applications = rxResource({
    params: () => ({ organizationId: this.organizationId(), campaignId: this.campaignId() }),
    stream: ({ params }) => this.engagement.listApplications(params),
    defaultValue: [],
  });

  private readonly affiliates = rxResource({
    stream: () => this.catalog.listAffiliates(),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) =>
      this.catalog.listCampaigns({ organizationId: params, pageSize: 50, includeAll: true }),
  });

  protected readonly visible = computed(() => {
    const items = this.applications.value();

    switch (this.filter()) {
      case 'pending':
        return items.filter((item) => PENDING_REVIEW.includes(item.status));
      case 'approved':
        return items.filter((item) => item.status === 'approved');
      case 'rejected':
        return items.filter((item) => item.status === 'rejected' || item.status === 'withdrawn');
      default:
        return items;
    }
  });

  protected readonly selectedAffiliate = computed(() => {
    const application = this.selected();
    return application
      ? (this.affiliates.value().find((item) => item.id === application.affiliateId) ?? null)
      : null;
  });

  protected readonly selectedCampaign = computed(() => {
    const application = this.selected();
    return application
      ? ((this.campaigns.value()?.items ?? []).find((item) => item.id === application.campaignId) ??
          null)
      : null;
  });

  protected readonly emptyTitle = computed(() =>
    this.filter() === 'pending' ? 'No hay solicitudes por revisar' : 'Ninguna solicitud aquí',
  );

  protected readonly emptyDescription = computed(() =>
    this.filter() === 'pending'
      ? 'Cuando alguien solicite unirse a una de tus campañas, aparecerá en esta bandeja.'
      : 'Prueba con otro filtro para ver el resto de solicitudes.',
  );

  protected countFor(filter: Filter): number | null {
    const items = this.applications.value();

    const count = {
      pending: items.filter((item) => PENDING_REVIEW.includes(item.status)).length,
      approved: items.filter((item) => item.status === 'approved').length,
      rejected: items.filter((item) => item.status === 'rejected' || item.status === 'withdrawn')
        .length,
      all: items.length,
    }[filter];

    return count || null;
  }

  protected review(application: Application): void {
    this.selected.set(application);
  }

  protected onDecided(): void {
    this.selected.set(null);
    this.applications.reload();
  }

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

  protected exportCsv(): void {
    const csv = toCsv(this.visible(), [
      { header: 'Afiliado', value: (item) => this.affiliateName(item.affiliateId) },
      { header: 'Campaña', value: (item) => this.campaignName(item.campaignId) },
      { header: 'Match', value: (item) => `${item.matchScore}%` },
      { header: 'Estado', value: (item) => item.status },
      { header: 'Enviada', value: (item) => item.submittedAt ?? item.createdAt },
      { header: 'Decidida', value: (item) => item.decidedAt },
    ]);

    downloadCsv(csvFilename('solicitudes', DEMO_TODAY), csv);
  }
}
