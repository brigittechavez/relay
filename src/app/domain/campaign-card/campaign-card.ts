import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Badge } from '@ds/badge/badge';
import { Icon } from '@ds/icon/icon';
import { Campaign, PRICE_UNIT_SUFFIX } from '@data/models/campaign';
import { Organization } from '@data/models/organization';
import { TAG_LABELS, categoryLabel } from '@data/models/taxonomy';
import { commissionLabel } from '@data/logic/commission';
import { MoneyPipe } from '@shared/pipes/format.pipes';
import { CampaignCover } from '../campaign-cover/campaign-cover';
import { MatchScore } from '../match-score/match-score';
import { AccessBadge, EndingBadge } from '../status/status-badges';

/**
 * Estado personal del afiliado respecto a la campaña.
 *
 * Determina la llamada a la acción de la tarjeta: no tiene sentido ofrecer
 * «Aplicar» a quien ya aplicó ni a quien no cumple los requisitos.
 */
export type CampaignRelation =
  'none' | 'eligible' | 'not-eligible' | 'applied' | 'approved' | 'invited';

export type CampaignCardVariant = 'featured' | 'grid' | 'horizontal' | 'compact';

const CTA: Record<CampaignRelation, string> = {
  none: 'Ver campaña',
  eligible: 'Ver y aplicar',
  'not-eligible': 'Ver requisitos',
  applied: 'Ver solicitud',
  approved: 'Ir a la campaña',
  invited: 'Revisar invitación',
};

/**
 * Tarjeta de campaña.
 *
 * Un único componente cubre los cuatro formatos del marketplace porque los
 * datos son los mismos y solo cambia cuánto cabe: mantenerlos separados haría
 * que la jerarquía se fuese desalineando entre secciones.
 *
 * La tarjeta no decide nada: recibe el match y la relación ya calculados y se
 * limita a presentarlos.
 */
@Component({
  selector: 'rly-campaign-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Badge,
    Icon,
    CampaignCover,
    MatchScore,
    AccessBadge,
    EndingBadge,
    MoneyPipe,
  ],
  host: { '[class]': 'hostClasses()' },
  template: `
    @if (variant() !== 'compact') {
      <div [class]="coverWrapperClasses()">
        <rly-campaign-cover
          [cover]="campaign().cover"
          [categoryId]="campaign().categoryId"
          [image]="campaign().image"
          [featured]="variant() === 'featured'"
          [size]="variant() === 'featured' ? 'lg' : 'md'"
          [label]="organization()?.initials ?? ''"
          class="size-full"
        />

        @if (showSave()) {
          <button
            type="button"
            [class]="saveButtonClasses()"
            [attr.aria-pressed]="saved()"
            [attr.aria-label]="saved() ? 'Quitar de guardadas' : 'Guardar campaña'"
            (click)="saveToggled.emit()"
          >
            <rly-icon [name]="saved() ? 'bookmark-filled' : 'bookmark'" [size]="16" />
          </button>
        }
      </div>
    }

    <div [class]="bodyClasses()">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate text-ui-sm text-text-secondary">
            {{ organization()?.name ?? '' }} · {{ category() }}
          </p>

          <h3 [class]="titleClasses()">
            <a [routerLink]="['/campanas', campaign().slug]" class="focus-ring rounded-xs">
              <span class="absolute inset-0" aria-hidden="true"></span>
              {{ campaign().name }}
            </a>
          </h3>
        </div>

        @if (matchScore() !== null) {
          <rly-match-score
            [value]="matchScore()!"
            [size]="variant() === 'featured' ? 'md' : 'sm'"
            [showLabel]="false"
          />
        }
      </div>

      @if (variant() !== 'compact') {
        <p class="mt-2 line-clamp-2 text-ui text-text-secondary">{{ campaign().summary }}</p>
      }

      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p class="text-ui font-medium text-ink">{{ commission() }}</p>
        <span class="text-ui-sm text-text-muted">
          {{ campaign().price | rlyMoney }}{{ priceSuffix() }}
        </span>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-1.5">
        <rly-access-badge [access]="campaign().access" outline />
        <rly-ending-badge [campaign]="campaign()" />

        @for (tag of visibleTags(); track tag) {
          <rly-badge tone="neutral" outline>{{ tagLabel(tag) }}</rly-badge>
        }
      </div>

      @if (relation() !== 'none') {
        <p [class]="ctaClasses()">
          {{ ctaLabel() }}
          <rly-icon name="arrow-right" [size]="14" />
        </p>
      }
    </div>
  `,
})
export class CampaignCard {
  readonly campaign = input.required<Campaign>();
  readonly organization = input<Organization | null>(null);
  readonly variant = input<CampaignCardVariant>('grid');

  /** Compatibilidad ya calculada. `null` en el marketplace sin sesión. */
  readonly matchScore = input<number | null>(null);
  readonly relation = input<CampaignRelation>('none');

  readonly saved = input(false, { transform: booleanAttribute });
  readonly showSave = input(true, { transform: booleanAttribute });

  readonly saveToggled = output<void>();

  protected readonly category = computed(() => categoryLabel(this.campaign().categoryId));
  protected readonly commission = computed(() => commissionLabel(this.campaign()));
  protected readonly ctaLabel = computed(() => CTA[this.relation()]);

  protected readonly priceSuffix = computed(() => PRICE_UNIT_SUFFIX[this.campaign().priceUnit]);

  /** Dos etiquetas como máximo: la tarjeta ya lleva acceso y cierre. */
  protected readonly visibleTags = computed(() =>
    this.campaign()
      .tags.filter((tag) => tag !== 'selectiva' && tag !== 'premium')
      .slice(0, this.variant() === 'featured' ? 3 : 2),
  );

  protected tagLabel(tag: string): string {
    return TAG_LABELS[tag as keyof typeof TAG_LABELS] ?? tag;
  }

  protected readonly hostClasses = computed(() => {
    const base =
      'group relative isolate flex overflow-hidden rounded-lg border border-border bg-surface ' +
      'transition-[border-color,box-shadow] duration-ui ease-standard ' +
      'hover:border-border-strong hover:shadow-sm focus-within:border-ink';

    switch (this.variant()) {
      case 'featured':
        return `${base} flex-col sm:flex-row`;
      case 'horizontal':
        return `${base} flex-row items-stretch`;
      case 'compact':
        return `${base} flex-col`;
      default:
        return `${base} flex-col`;
    }
  });

  protected readonly coverWrapperClasses = computed(() => {
    switch (this.variant()) {
      case 'featured':
        return 'relative shrink-0 sm:w-2/5';
      case 'horizontal':
        return 'relative w-28 shrink-0 sm:w-40';
      default:
        return 'relative';
    }
  });

  protected readonly bodyClasses = computed(() =>
    this.variant() === 'featured' ? 'flex flex-1 flex-col p-5 sm:p-6' : 'flex flex-1 flex-col p-4',
  );

  protected readonly titleClasses = computed(() =>
    this.variant() === 'featured' ? 'mt-1 text-title-sm text-ink' : 'mt-0.5 text-title-xs text-ink',
  );

  protected readonly ctaClasses = computed(() =>
    [
      'mt-4 inline-flex items-center gap-1.5 text-ui font-medium',
      this.relation() === 'not-eligible' ? 'text-text-secondary' : 'text-ink',
      'transition-transform duration-micro group-hover:translate-x-0.5',
    ].join(' '),
  );

  protected readonly saveButtonClasses = computed(() =>
    [
      'focus-ring absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-sm',
      'border transition-colors duration-micro',
      this.saved()
        ? 'border-ink bg-ink text-accent'
        : 'border-border bg-surface/90 text-text-secondary hover:bg-surface hover:text-ink',
    ].join(' '),
  );
}
