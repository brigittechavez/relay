import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { Badge } from '@ds/badge/badge';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { Skeleton } from '@ds/skeleton/skeleton';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { DatePipe } from '@shared/pipes/format.pipes';

/**
 * Equipo de la organización.
 *
 * Dos roles y nada más: propietario y miembro. RELAY no modela permisos
 * granulares porque un sistema de roles detallado exigiría decisiones de
 * producto —quién puede aprobar comisiones, quién puede publicar— que este
 * proyecto no toma.
 */
@Component({
  selector: 'rly-organization-team-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, EmptyState, Icon, Skeleton, DatePipe],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <div class="mx-auto max-w-2xl">
        <header>
          <h2 class="text-title-md text-ink">Equipo</h2>
          <p class="mt-1 text-ui text-text-secondary">
            Quién puede administrar las campañas de
            {{ organization.value()?.name ?? 'la organización' }}.
          </p>
        </header>

        @if (organization.isLoading()) {
          <rly-skeleton class="mt-6" shape="block" height="12rem" />
        } @else if (!members().length) {
          <div class="mt-6 rounded-lg border border-border bg-surface">
            <rly-empty-state
              icon="team"
              title="Todavía no hay equipo"
              description="Esta organización la administra una sola persona."
            />
          </div>
        } @else {
          <ul class="mt-6 flex flex-col gap-2">
            @for (member of members(); track member.id) {
              <li
                class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border
                       bg-surface p-4"
              >
                <span
                  class="grid size-10 shrink-0 place-items-center rounded-md bg-surface-muted
                         text-ui-sm font-semibold text-ink"
                  aria-hidden="true"
                >
                  {{ member.initials }}
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block truncate text-ui font-medium text-ink">{{ member.name }}</span>
                  <span class="block truncate text-ui-sm text-text-secondary">
                    {{ member.email }}
                  </span>
                </span>

                <rly-badge [tone]="member.role === 'owner' ? 'inverse' : 'neutral'">
                  {{ member.role === 'owner' ? 'Propietario' : 'Miembro' }}
                </rly-badge>

                @if (member.status === 'invited') {
                  <rly-badge tone="warning" outline>Invitación pendiente</rly-badge>
                } @else {
                  <span class="text-ui-sm text-text-muted">
                    Desde {{ member.joinedAt | rlyDate }}
                  </span>
                }
              </li>
            }
          </ul>
        }

        <p
          class="mt-6 flex items-start gap-2.5 rounded-md border border-border bg-surface-muted
                 px-4 py-3 text-ui-sm text-text-secondary"
        >
          <rly-icon name="info" [size]="16" class="mt-0.5 text-info" />
          <span>
            La gestión de invitaciones está fuera del alcance de este proyecto: no hay envío de
            correo ni sistema de permisos granular. Los dos roles existentes se muestran tal como
            los define el modelo de datos.
          </span>
        </p>
      </div>
    </div>
  `,
})
export class OrganizationTeamPage {
  private readonly catalog = inject(CatalogRepository);

  readonly organizationId = input.required<string>();

  protected readonly organization = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.catalog.organization(params),
  });

  protected readonly members = computed(() => this.organization.value()?.team ?? []);
}
