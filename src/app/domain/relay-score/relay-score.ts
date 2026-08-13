import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { Badge } from '@ds/badge/badge';
import { Affiliate, RelayScoreBreakdown, SCORE_LABELS, SCORE_MAX } from '@data/models/affiliate';
import { AFFILIATE_LEVELS, AFFILIATE_LEVEL_LABELS } from '@data/models/taxonomy';

/**
 * Relay Score y nivel.
 *
 * Es una puntuación **simulada**, así que la interfaz muestra siempre el
 * desglose: sin él, un 84 sobre 100 sería un número sin significado. Los cuatro
 * componentes suman 100 y cada uno indica su tope.
 */
@Component({
  selector: 'rly-relay-score',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'block' },
  template: `
    <div class="flex items-center gap-4">
      <div class="flex items-baseline gap-1">
        <span class="text-kpi text-ink">{{ affiliate().relayScore }}</span>
        <span class="text-ui text-text-muted">/ 100</span>
      </div>

      <div>
        <rly-badge tone="inverse">{{ levelLabel() }}</rly-badge>
        @if (nextLevel()) {
          <p class="mt-1 text-ui-sm text-text-secondary">
            {{ affiliate().levelProgress }}% hacia {{ nextLevel() }}
          </p>
        } @else {
          <p class="mt-1 text-ui-sm text-text-secondary">Nivel máximo alcanzado</p>
        }
      </div>
    </div>

    @if (nextLevel()) {
      <div
        class="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        [attr.aria-valuenow]="affiliate().levelProgress"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="'Progreso hacia ' + nextLevel()"
      >
        <div
          class="h-full rounded-full bg-accent"
          [style.width.%]="affiliate().levelProgress"
        ></div>
      </div>
    }

    @if (showBreakdown()) {
      <ul class="mt-5 flex flex-col gap-3">
        @for (item of breakdown(); track item.id) {
          <li>
            <div class="flex items-baseline justify-between gap-3 text-ui-sm">
              <span class="text-text-secondary">{{ item.label }}</span>
              <span class="tabular-nums text-ink">
                <span class="font-medium">{{ item.value }}</span>
                <span class="text-text-muted">/ {{ item.max }}</span>
              </span>
            </div>
            <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-muted">
              <div class="h-full rounded-full bg-ink" [style.width.%]="item.percent"></div>
            </div>
          </li>
        }
      </ul>

      <p class="mt-4 text-ui-sm text-text-muted">
        Resume rendimiento, experiencia, perfil y consistencia.
      </p>
    }
  `,
})
export class RelayScore {
  readonly affiliate = input.required<Affiliate>();
  readonly showBreakdown = input(true, { transform: booleanAttribute });

  protected readonly levelLabel = computed(() => AFFILIATE_LEVEL_LABELS[this.affiliate().level]);

  protected readonly nextLevel = computed(() => {
    const index = AFFILIATE_LEVELS.indexOf(this.affiliate().level);
    const next = AFFILIATE_LEVELS[index + 1];
    return next ? AFFILIATE_LEVEL_LABELS[next] : null;
  });

  protected readonly breakdown = computed(() => {
    const scores = this.affiliate().scoreBreakdown;

    return (Object.keys(scores) as (keyof RelayScoreBreakdown)[]).map((id) => ({
      id,
      label: SCORE_LABELS[id],
      value: scores[id],
      max: SCORE_MAX[id],
      percent: (scores[id] / SCORE_MAX[id]) * 100,
    }));
  });
}
