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
import { Affiliate, totalAudience } from '@data/models/affiliate';
import {
  AFFILIATE_LEVEL_LABELS,
  AFFILIATE_TYPE_LABELS,
  NICHE_LABELS,
  channelIcon,
  channelLabel,
} from '@data/models/taxonomy';
import { CompactPipe, PercentPipe } from '@shared/pipes/format.pipes';
import { MatchScore } from '../match-score/match-score';

/**
 * Tarjeta de afiliado, para el descubrimiento desde una organización.
 *
 * Muestra únicamente lo que un anunciante necesita para decidir si invitar:
 * a quién llega, dónde publica y qué resultados tiene. Los datos financieros
 * del afiliado no aparecen nunca aquí.
 */
@Component({
  selector: 'rly-affiliate-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Icon, MatchScore, CompactPipe, PercentPipe],
  host: {
    class:
      'group relative isolate flex flex-col rounded-lg border border-border bg-surface p-5 ' +
      'transition-[border-color,box-shadow] duration-ui hover:border-border-strong hover:shadow-sm',
  },
  template: `
    <div class="flex items-start gap-3">
      <span
        class="grid size-11 shrink-0 place-items-center rounded-md bg-ink text-ui font-semibold
               text-text-inverse"
        aria-hidden="true"
      >
        {{ affiliate().initials }}
      </span>

      <div class="min-w-0 flex-1">
        <h3 class="truncate text-title-xs text-ink">
          <a [routerLink]="['/afiliados', affiliate().slug]" class="focus-ring rounded-xs">
            <span class="absolute inset-0" aria-hidden="true"></span>
            {{ affiliate().name }}
          </a>
        </h3>
        <p class="truncate text-ui-sm text-text-secondary">
          {{ typeLabel() }} · {{ affiliate().location }}
        </p>
      </div>

      @if (matchScore() !== null) {
        <rly-match-score [value]="matchScore()!" size="sm" [showLabel]="false" />
      }
    </div>

    <p class="mt-3 line-clamp-2 text-ui text-text-secondary">{{ affiliate().headline }}</p>

    <dl class="mt-4 grid grid-cols-3 gap-3 border-y border-border py-3">
      <div>
        <dt class="text-ui-sm text-text-muted">Audiencia</dt>
        <dd class="text-ui font-medium tabular-nums text-ink">{{ audience() | rlyCompact }}</dd>
      </div>
      <div>
        <dt class="text-ui-sm text-text-muted">Conversión</dt>
        <dd class="text-ui font-medium tabular-nums text-ink">
          {{ affiliate().averageConversionRate | rlyPercent: 2 }}
        </dd>
      </div>
      <div>
        <dt class="text-ui-sm text-text-muted">Nivel</dt>
        <dd class="text-ui font-medium text-ink">{{ levelLabel() }}</dd>
      </div>
    </dl>

    <div class="mt-3 flex flex-wrap items-center gap-1.5">
      @for (niche of affiliate().niches.slice(0, 3); track niche) {
        <rly-badge tone="neutral" outline>{{ nicheLabel(niche) }}</rly-badge>
      }
    </div>

    <ul class="mt-3 flex flex-wrap items-center gap-3">
      @for (channel of affiliate().channels; track channel.id) {
        <li class="flex items-center gap-1.5 text-ui-sm text-text-secondary">
          <rly-icon [name]="iconFor(channel.id)" [size]="14" />
          <span>{{ labelFor(channel.id) }}</span>
          <span class="tabular-nums text-text-muted">{{ channel.audience | rlyCompact }}</span>
        </li>
      }
    </ul>

    @if (showActions()) {
      <div class="relative z-10 mt-5 flex gap-2">
        <ng-content />
      </div>
    }
  `,
})
export class AffiliateCard {
  readonly affiliate = input.required<Affiliate>();

  /** Compatibilidad con una campaña concreta, cuando se llega desde ella. */
  readonly matchScore = input<number | null>(null);

  readonly showActions = input(false, { transform: booleanAttribute });

  readonly saveToggled = output<void>();

  protected readonly audience = computed(() => totalAudience(this.affiliate()));
  protected readonly typeLabel = computed(() => AFFILIATE_TYPE_LABELS[this.affiliate().type]);
  protected readonly levelLabel = computed(() => AFFILIATE_LEVEL_LABELS[this.affiliate().level]);

  protected nicheLabel(niche: string): string {
    return NICHE_LABELS[niche as keyof typeof NICHE_LABELS] ?? niche;
  }

  protected iconFor(channel: string) {
    return channelIcon(channel as never);
  }

  protected labelFor(channel: string): string {
    return channelLabel(channel as never);
  }
}
