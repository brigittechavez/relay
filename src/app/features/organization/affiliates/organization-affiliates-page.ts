import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Icon } from '@ds/icon/icon';
import { InputField, SearchInput } from '@ds/input/input';
import { Modal } from '@ds/modal/modal';
import { Select, SelectField } from '@ds/select/select';
import { Skeleton } from '@ds/skeleton/skeleton';
import { Tabs } from '@ds/tabs/tabs';
import { ToastService } from '@ds/toast/toast.service';
import { SavedStore } from '@core/session/saved.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { Affiliate } from '@data/models/affiliate';
import {
  AFFILIATE_LEVELS,
  AFFILIATE_LEVEL_LABELS,
  NICHE_LABELS,
  NicheId,
} from '@data/models/taxonomy';
import { totals } from '@data/logic/analytics';
import { computeMatchScore } from '@data/logic/matching';
import { AffiliateCard } from '@domain/affiliate-card/affiliate-card';
import { PartnershipStatusBadge } from '@domain/status/status-badges';
import { MoneyPipe, NumberPipe } from '@shared/pipes/format.pipes';

const NICHES = Object.keys(NICHE_LABELS) as NicheId[];

/**
 * Afiliados de la organización.
 *
 * Dos modos con propósitos distintos: gestionar a quien ya trabaja contigo y
 * descubrir a quien podría hacerlo. El descubrimiento ordena por compatibilidad
 * con una campaña concreta, porque «buen afiliado» no significa nada sin decir
 * para qué.
 */
@Component({
  selector: 'rly-organization-affiliates-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    Chip,
    EmptyState,
    Icon,
    InputField,
    SearchInput,
    Modal,
    Select,
    SelectField,
    Skeleton,
    Tabs,
    AffiliateCard,
    PartnershipStatusBadge,
    MoneyPipe,
    NumberPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <header>
        <h2 class="text-title-md text-ink">Afiliados</h2>
        <p class="mt-1 text-ui text-text-secondary">
          Quién promociona tus campañas y a quién podrías invitar.
        </p>
      </header>

      <rly-tabs
        class="mt-6"
        [tabs]="tabs()"
        [selected]="tab()"
        idPrefix="affiliates"
        (selectedChange)="setTab($event)"
      />

      @if (tab() === 'active') {
        @if (partnerships.isLoading()) {
          <div class="mt-6 flex flex-col gap-2">
            @for (item of [1, 2, 3]; track item) {
              <rly-skeleton shape="block" height="5rem" />
            }
          </div>
        } @else if (!activeRows().length) {
          <div class="mt-6 rounded-lg border border-border bg-surface">
            <rly-empty-state
              icon="affiliates"
              title="Todavía no hay afiliados activos"
              description="Aprueba una solicitud o invita a alguien desde el descubrimiento."
            >
              <button rlyButton variant="primary" type="button" (click)="tab.set('discover')">
                Descubrir afiliados
              </button>
            </rly-empty-state>
          </div>
        } @else {
          <ul class="mt-6 flex flex-col gap-2">
            @for (row of activeRows(); track row.partnership.id) {
              <li
                class="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-border
                       bg-surface p-4"
              >
                <span
                  class="grid size-10 shrink-0 place-items-center rounded-md bg-ink text-ui-sm
                         font-semibold text-text-inverse"
                  aria-hidden="true"
                >
                  {{ row.affiliate?.initials }}
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block truncate text-ui font-medium text-ink">
                    {{ row.affiliate?.name }}
                  </span>
                  <span class="block truncate text-ui-sm text-text-secondary">
                    {{ campaignName(row.partnership.campaignId) }}
                  </span>
                </span>

                <rly-partnership-status [status]="row.partnership.status" />

                <span class="text-right">
                  <span class="block text-ui-sm text-text-muted">Conversiones</span>
                  <span class="block text-ui tabular-nums text-ink">
                    {{ row.conversions | rlyNumber }}
                  </span>
                </span>

                <span class="text-right">
                  <span class="block text-ui-sm text-text-muted">Revenue</span>
                  <span class="block text-ui font-medium tabular-nums text-ink">
                    {{ row.revenue | rlyMoney }}
                  </span>
                </span>

                <span class="flex gap-2">
                  @if (row.partnership.status === 'active') {
                    <button
                      rlyButton
                      variant="tertiary"
                      size="sm"
                      type="button"
                      (click)="setStatus(row.partnership.id, 'paused')"
                    >
                      Pausar
                    </button>
                  } @else if (row.partnership.status === 'paused') {
                    <button
                      rlyButton
                      variant="tertiary"
                      size="sm"
                      type="button"
                      (click)="setStatus(row.partnership.id, 'active')"
                    >
                      Reactivar
                    </button>
                  }
                </span>
              </li>
            }
          </ul>
        }
      } @else {
        <!-- Descubrimiento -->
        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <rly-search-input class="flex-1">
            <input
              rlyInput
              withLeadingIcon
              type="search"
              [value]="query()"
              aria-label="Buscar afiliados"
              placeholder="Buscar por nombre o titular"
              (input)="onSearch($event)"
            />
          </rly-search-input>

          <rly-select class="sm:w-56">
            <select
              rlySelect
              aria-label="Compatibilidad con la campaña"
              [value]="matchCampaign()"
              (change)="onCampaignChange($event)"
            >
              <option value="">Sin campaña de referencia</option>
              @for (campaign of activeCampaigns(); track campaign.id) {
                <option [value]="campaign.id">Match con {{ campaign.name }}</option>
              }
            </select>
          </rly-select>
        </div>

        <div class="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          @for (level of levels; track level) {
            <rly-chip [selected]="levelFilter() === level" (toggled)="toggleLevel(level)">
              {{ levelLabel(level) }}
            </rly-chip>
          }

          @for (niche of niches.slice(0, 5); track niche) {
            <rly-chip [selected]="nicheFilter() === niche" (toggled)="toggleNiche(niche)">
              {{ nicheLabel(niche) }}
            </rly-chip>
          }
        </div>

        @if (affiliates.isLoading()) {
          <div class="grid-cards mt-6">
            @for (item of [1, 2, 3]; track item) {
              <rly-skeleton shape="block" height="18rem" />
            }
          </div>
        } @else if (!discovered().length) {
          <div class="mt-6 rounded-lg border border-border bg-surface">
            <rly-empty-state
              icon="search"
              title="Ningún afiliado coincide con estos filtros"
              description="Prueba a quitar el nivel o el nicho para ampliar la búsqueda."
            >
              <button rlyButton variant="tertiary" type="button" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </rly-empty-state>
          </div>
        } @else {
          <div class="grid-cards mt-6">
            @for (affiliate of discovered(); track affiliate.id) {
              <rly-affiliate-card
                [affiliate]="affiliate"
                [matchScore]="matchFor(affiliate)"
                showActions
              >
                <button
                  rlyButton
                  variant="tertiary"
                  size="sm"
                  type="button"
                  [attr.aria-pressed]="saved.isAffiliateSaved(affiliate.id)"
                  (click)="saved.toggleAffiliate(affiliate.id)"
                >
                  <rly-icon
                    [name]="saved.isAffiliateSaved(affiliate.id) ? 'bookmark-filled' : 'bookmark'"
                    [size]="14"
                  />
                  {{ saved.isAffiliateSaved(affiliate.id) ? 'Guardado' : 'Guardar' }}
                </button>

                <button
                  rlyButton
                  variant="primary"
                  size="sm"
                  type="button"
                  (click)="openInvite(affiliate)"
                >
                  Invitar
                </button>
              </rly-affiliate-card>
            }
          </div>
        }
      }
    </div>

    <!-- Invitación -->
    <rly-modal
      [open]="inviting() !== null"
      title="Invitar a una campaña"
      [description]="inviting()?.name ?? ''"
      size="sm"
      (closed)="inviting.set(null)"
    >
      <p class="text-ui text-text-secondary">
        Se le enviará una invitación a la campaña que elijas. Podrá revisar las condiciones antes de
        aceptar.
      </p>

      <label class="mt-4 block">
        <span class="mb-1.5 block text-ui-sm font-medium text-ink">Campaña</span>
        <rly-select>
          <select rlySelect [value]="inviteCampaign()" (change)="onInviteCampaignChange($event)">
            @for (campaign of activeCampaigns(); track campaign.id) {
              <option [value]="campaign.id">{{ campaign.name }}</option>
            }
          </select>
        </rly-select>
      </label>

      <p class="mt-4 text-ui-sm text-text-muted">
        Las invitaciones son simuladas en este proyecto: no se envía ningún correo.
      </p>

      <button modalFooter rlyButton variant="ghost" (click)="inviting.set(null)">Cancelar</button>
      <button modalFooter rlyButton variant="primary" (click)="invite()">Enviar invitación</button>
    </rly-modal>
  `,
})
export class OrganizationAffiliatesPage {
  private readonly catalog = inject(CatalogRepository);
  private readonly engagement = inject(EngagementRepository);
  private readonly toasts = inject(ToastService);

  protected readonly saved = inject(SavedStore);

  readonly organizationId = input.required<string>();

  protected readonly levels = AFFILIATE_LEVELS;
  protected readonly niches = NICHES;

  protected readonly tab = signal<'active' | 'discover'>('active');
  protected readonly query = signal('');
  protected readonly levelFilter = signal<string | null>(null);
  protected readonly nicheFilter = signal<NicheId | null>(null);
  protected readonly matchCampaign = signal('');
  protected readonly inviting = signal<Affiliate | null>(null);
  protected readonly inviteCampaign = signal('');

  private readonly partnershipList = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.engagement.listPartnerships({ organizationId: params }),
    defaultValue: [],
  });

  protected readonly partnerships = this.partnershipList;

  private readonly conversions = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.engagement.listConversions({ organizationId: params }),
    defaultValue: [],
  });

  protected readonly affiliates = rxResource({
    params: () => ({
      q: this.query(),
      level: this.levelFilter() ?? undefined,
      niche: this.nicheFilter() ?? undefined,
    }),
    stream: ({ params }) => this.catalog.listAffiliates(params),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.catalog.listCampaigns({ organizationId: params, pageSize: 50 }),
  });

  protected readonly activeCampaigns = computed(() =>
    (this.campaigns.value()?.items ?? []).filter((campaign) => campaign.status === 'active'),
  );

  protected readonly activeRows = computed(() => {
    const affiliates = this.affiliates.value();

    return this.partnershipList
      .value()
      .filter((partnership) => partnership.status !== 'ended')
      .map((partnership) => {
        const stats = totals(
          this.conversions
            .value()
            .filter(
              (item) =>
                item.affiliateId === partnership.affiliateId &&
                item.campaignId === partnership.campaignId,
            ),
        );

        return {
          partnership,
          affiliate: affiliates.find((item) => item.id === partnership.affiliateId) ?? null,
          conversions: stats.conversions,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  });

  /** El descubrimiento excluye a quien ya está trabajando en alguna campaña. */
  protected readonly discovered = computed(() => {
    const engaged = new Set(
      this.partnershipList
        .value()
        .filter((partnership) => partnership.status !== 'ended')
        .map((partnership) => partnership.affiliateId),
    );

    const items = this.affiliates.value().filter((affiliate) => !engaged.has(affiliate.id));
    const campaign = this.matchCampaign();

    if (!campaign) return items;

    return [...items].sort((a, b) => (this.matchFor(b) ?? 0) - (this.matchFor(a) ?? 0));
  });

  protected readonly tabs = computed(() => [
    { id: 'active', label: 'Activos', count: this.activeRows().length },
    { id: 'discover', label: 'Descubrir', count: this.discovered().length },
  ]);

  protected setTab(id: string): void {
    this.tab.set(id === 'discover' ? 'discover' : 'active');
  }

  protected matchFor(affiliate: Affiliate): number | null {
    const campaign = (this.campaigns.value()?.items ?? []).find(
      (item) => item.id === this.matchCampaign(),
    );

    return campaign ? computeMatchScore(affiliate, campaign) : null;
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onCampaignChange(event: Event): void {
    this.matchCampaign.set((event.target as HTMLSelectElement).value);
  }

  protected onInviteCampaignChange(event: Event): void {
    this.inviteCampaign.set((event.target as HTMLSelectElement).value);
  }

  protected toggleLevel(level: string): void {
    this.levelFilter.update((current) => (current === level ? null : level));
  }

  protected toggleNiche(niche: NicheId): void {
    this.nicheFilter.update((current) => (current === niche ? null : niche));
  }

  protected clearFilters(): void {
    this.query.set('');
    this.levelFilter.set(null);
    this.nicheFilter.set(null);
  }

  protected openInvite(affiliate: Affiliate): void {
    this.inviteCampaign.set(this.activeCampaigns()[0]?.id ?? '');
    this.inviting.set(affiliate);
  }

  protected invite(): void {
    const affiliate = this.inviting();
    const campaign = this.activeCampaigns().find((item) => item.id === this.inviteCampaign());

    if (affiliate && campaign) {
      this.toasts.success(`Invitación enviada a ${affiliate.name} para ${campaign.name}`);
    }

    this.inviting.set(null);
  }

  protected async setStatus(partnershipId: string, status: 'active' | 'paused'): Promise<void> {
    try {
      await firstValueFrom(this.engagement.updatePartnership(partnershipId, { status }));
      this.partnershipList.reload();
      this.toasts.success(status === 'paused' ? 'Colaboración pausada' : 'Colaboración reactivada');
    } catch {
      this.toasts.error('No se pudo cambiar el estado');
    }
  }

  protected campaignName(campaignId: string): string {
    return (
      (this.campaigns.value()?.items ?? []).find((campaign) => campaign.id === campaignId)?.name ??
      campaignId
    );
  }

  protected levelLabel(level: string): string {
    return AFFILIATE_LEVEL_LABELS[level as keyof typeof AFFILIATE_LEVEL_LABELS] ?? level;
  }

  protected nicheLabel(niche: NicheId): string {
    return NICHE_LABELS[niche];
  }
}
