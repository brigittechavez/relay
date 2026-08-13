import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Checkbox } from '@ds/choice/choice';
import { CampaignAccess, CommissionModel } from '@data/models/campaign';
import { CATEGORIES, CategoryId, CHANNELS, ChannelId, TAG_LABELS, TagId } from '@data/models/taxonomy';
import { MarketplaceFilters, toggle } from './marketplace-filters';

const ACCESS_OPTIONS: readonly { readonly id: CampaignAccess; readonly label: string }[] = [
  { id: 'open', label: 'Abierta · aceptación inmediata' },
  { id: 'selective', label: 'Selectiva · requiere aprobación' },
  { id: 'premium', label: 'Premium · revisión detallada' },
];

const COMMISSION_OPTIONS: readonly { readonly id: CommissionModel; readonly label: string }[] = [
  { id: 'fixed', label: 'Monto fijo por conversión' },
  { id: 'percentage', label: 'Porcentaje por venta' },
  { id: 'recurring', label: 'Recurrente' },
  { id: 'per-lead', label: 'Por lead' },
];

const TAG_OPTIONS: readonly TagId[] = [
  'alta-comision',
  'recurrente',
  'aceptacion-inmediata',
  'trending',
  'top-performing',
  'nuevo',
];

/**
 * Contenido del panel de filtros.
 *
 * Se separa de la página porque es el mismo panel en el marketplace público y
 * en el autenticado, y porque así el drawer no arrastra la lógica de datos.
 * Los filtros que dependen del perfil solo se muestran con sesión demo.
 */
@Component({
  selector: 'rly-marketplace-filter-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Checkbox],
  host: { class: 'flex flex-col gap-7' },
  template: `
    <fieldset>
      <legend class="text-ui-sm font-medium text-ink">Categoría</legend>
      <div class="mt-3 flex flex-col gap-2.5">
        @for (category of categories; track category.id) {
          <label class="flex items-center gap-2.5 text-ui text-text-secondary">
            <input
              rlyCheckbox
              type="checkbox"
              [checked]="filters().categories.includes(category.id)"
              (change)="toggleCategory(category.id)"
            />
            {{ category.label }}
          </label>
        }
      </div>
    </fieldset>

    <fieldset>
      <legend class="text-ui-sm font-medium text-ink">Modalidad de acceso</legend>
      <div class="mt-3 flex flex-col gap-2.5">
        @for (option of accessOptions; track option.id) {
          <label class="flex items-center gap-2.5 text-ui text-text-secondary">
            <input
              rlyCheckbox
              type="checkbox"
              [checked]="filters().access.includes(option.id)"
              (change)="toggleAccess(option.id)"
            />
            {{ option.label }}
          </label>
        }
      </div>
    </fieldset>

    <fieldset>
      <legend class="text-ui-sm font-medium text-ink">Modelo de comisión</legend>
      <div class="mt-3 flex flex-col gap-2.5">
        @for (option of commissionOptions; track option.id) {
          <label class="flex items-center gap-2.5 text-ui text-text-secondary">
            <input
              rlyCheckbox
              type="checkbox"
              [checked]="filters().commissionModels.includes(option.id)"
              (change)="toggleCommission(option.id)"
            />
            {{ option.label }}
          </label>
        }
      </div>
    </fieldset>

    <fieldset>
      <legend class="text-ui-sm font-medium text-ink">Canal permitido</legend>
      <div class="mt-3 flex flex-col gap-2.5">
        @for (channel of channels; track channel.id) {
          <label class="flex items-center gap-2.5 text-ui text-text-secondary">
            <input
              rlyCheckbox
              type="checkbox"
              [checked]="filters().channels.includes(channel.id)"
              (change)="toggleChannel(channel.id)"
            />
            {{ channel.label }}
          </label>
        }
      </div>
    </fieldset>

    <fieldset>
      <legend class="text-ui-sm font-medium text-ink">Etiquetas</legend>
      <div class="mt-3 flex flex-col gap-2.5">
        @for (tag of tagOptions; track tag) {
          <label class="flex items-center gap-2.5 text-ui text-text-secondary">
            <input
              rlyCheckbox
              type="checkbox"
              [checked]="filters().tags.includes(tag)"
              (change)="toggleTag(tag)"
            />
            {{ tagLabel(tag) }}
          </label>
        }
      </div>
    </fieldset>

    @if (hasSession()) {
      <fieldset>
        <legend class="text-ui-sm font-medium text-ink">Mi perfil</legend>
        <div class="mt-3 flex flex-col gap-2.5">
          <label class="flex items-center gap-2.5 text-ui text-text-secondary">
            <input
              rlyCheckbox
              type="checkbox"
              [checked]="filters().eligible"
              (change)="patch({ eligible: !filters().eligible })"
            />
            Solo campañas para las que califico
          </label>
          <label class="flex items-center gap-2.5 text-ui text-text-secondary">
            <input
              rlyCheckbox
              type="checkbox"
              [checked]="filters().minMatch >= 80"
              (change)="patch({ minMatch: filters().minMatch >= 80 ? 0 : 80 })"
            />
            Compatibilidad superior al 80%
          </label>
          <label class="flex items-center gap-2.5 text-ui text-text-secondary">
            <input
              rlyCheckbox
              type="checkbox"
              [checked]="filters().saved"
              (change)="patch({ saved: !filters().saved })"
            />
            Solo campañas guardadas
          </label>
        </div>
      </fieldset>
    }
  `,
})
export class MarketplaceFilterPanel {
  readonly filters = input.required<MarketplaceFilters>();
  readonly hasSession = input(false, { transform: booleanAttribute });

  readonly filtersChanged = output<MarketplaceFilters>();

  protected readonly categories = CATEGORIES;
  protected readonly channels = CHANNELS;
  protected readonly accessOptions = ACCESS_OPTIONS;
  protected readonly commissionOptions = COMMISSION_OPTIONS;
  protected readonly tagOptions = TAG_OPTIONS;

  protected tagLabel(tag: TagId): string {
    return TAG_LABELS[tag];
  }

  protected toggleCategory(id: CategoryId): void {
    this.patch({ categories: toggle(this.filters().categories, id) });
  }

  protected toggleAccess(id: CampaignAccess): void {
    this.patch({ access: toggle(this.filters().access, id) });
  }

  protected toggleCommission(id: CommissionModel): void {
    this.patch({ commissionModels: toggle(this.filters().commissionModels, id) });
  }

  protected toggleChannel(id: ChannelId): void {
    this.patch({ channels: toggle(this.filters().channels, id) });
  }

  protected toggleTag(id: TagId): void {
    this.patch({ tags: toggle(this.filters().tags, id) });
  }

  protected patch(patch: Partial<MarketplaceFilters>): void {
    this.filtersChanged.emit({ ...this.filters(), ...patch });
  }
}
