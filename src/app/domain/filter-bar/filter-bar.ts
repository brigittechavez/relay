import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { Button } from '@ds/button/button';
import { Chip } from '@ds/chip/chip';
import { Icon } from '@ds/icon/icon';
import { InputField, SearchInput } from '@ds/input/input';
import { Select, SelectField } from '@ds/select/select';
import { IconName } from '@ds/icon/icon-registry.generated';

export interface QuickFilter {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly active: boolean;
  /** Requiere sesión demo: en el marketplace público se oculta. */
  readonly requiresSession?: boolean;
}

export interface SortOption {
  readonly id: string;
  readonly label: string;
}

/**
 * Barra de descubrimiento: búsqueda, filtros rápidos, orden y acceso al resto.
 *
 * En móvil los chips se desplazan en horizontal y el resto de filtros vive en
 * una hoja inferior; en escritorio conviven en una fila. La barra no guarda
 * estado: lo recibe y emite intenciones.
 */
@Component({
  selector: 'rly-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Chip, Icon, InputField, SearchInput, Select, SelectField],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <rly-search-input class="flex-1">
        <label [for]="searchId" class="sr-only">{{ searchLabel() }}</label>
        <input
          rlyInput
          withLeadingIcon
          [id]="searchId"
          type="search"
          [value]="query()"
          [placeholder]="searchPlaceholder()"
          (input)="onSearch($event)"
        />
      </rly-search-input>

      <div class="flex items-center gap-2">
        @if (sortOptions().length) {
          <rly-select class="min-w-44">
            <label [for]="sortId" class="sr-only">Ordenar por</label>
            <select rlySelect compact [id]="sortId" [value]="sort()" (change)="onSort($event)">
              @for (option of sortOptions(); track option.id) {
                <option [value]="option.id">{{ option.label }}</option>
              }
            </select>
          </rly-select>
        }

        <button
          rlyButton
          variant="tertiary"
          size="md"
          type="button"
          class="shrink-0"
          (click)="moreRequested.emit()"
        >
          <rly-icon name="filter" [size]="16" />
          <span>Más filtros</span>
          @if (activeCount()) {
            <span
              class="grid size-5 place-items-center rounded-full bg-ink text-[0.6875rem]
                     font-semibold tabular-nums text-text-inverse"
            >
              {{ activeCount() }}
            </span>
          }
        </button>
      </div>
    </div>

    @if (quickFilters().length) {
      <div class="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        @for (filter of visibleQuickFilters(); track filter.id) {
          <rly-chip
            [selected]="filter.active"
            [icon]="filter.icon ?? null"
            (toggled)="quickFilterToggled.emit(filter.id)"
          >
            {{ filter.label }}
          </rly-chip>
        }
      </div>
    }
  `,
})
export class FilterBar {
  private static sequence = 0;
  private readonly uid = `rly-filters-${++FilterBar.sequence}`;

  protected readonly searchId = `${this.uid}-search`;
  protected readonly sortId = `${this.uid}-sort`;

  readonly query = input('');
  readonly searchLabel = input('Buscar');
  readonly searchPlaceholder = input('Buscar');

  readonly quickFilters = input<readonly QuickFilter[]>([]);
  readonly sortOptions = input<readonly SortOption[]>([]);
  readonly sort = input('');
  readonly activeCount = input(0);

  /** Oculta los filtros que dependen del perfil cuando no hay sesión demo. */
  readonly hasSession = input(false, { transform: booleanAttribute });

  readonly queryChanged = output<string>();
  readonly sortChanged = output<string>();
  readonly quickFilterToggled = output<string>();
  readonly moreRequested = output<void>();

  protected readonly visibleQuickFilters = computed(() =>
    this.quickFilters().filter((filter) => this.hasSession() || !filter.requiresSession),
  );

  protected onSearch(event: Event): void {
    this.queryChanged.emit((event.target as HTMLInputElement).value);
  }

  protected onSort(event: Event): void {
    this.sortChanged.emit((event.target as HTMLSelectElement).value);
  }
}
