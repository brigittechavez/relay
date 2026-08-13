import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { Icon } from '@ds/icon/icon';
import { Campaign } from '@data/models/campaign';
import { estimateEarnings } from '@data/logic/commission';
import { MoneyPipe } from '@shared/pipes/format.pipes';

/**
 * Calculadora de ingresos del detalle de campaña.
 *
 * Un solo control: cuántas conversiones. Todo lo demás sale de las condiciones
 * de la campaña, de modo que el resultado no depende de suposiciones que el
 * usuario no puede verificar. El aviso de estimación es parte del componente,
 * no un añadido opcional de quien lo use.
 */
@Component({
  selector: 'rly-earnings-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, MoneyPipe],
  host: { class: 'block' },
  template: `
    <div class="flex items-baseline justify-between gap-3">
      <label [for]="inputId" class="text-ui font-medium text-ink">Conversiones al mes</label>
      <output [for]="inputId" class="text-title-xs tabular-nums text-ink">
        {{ conversions() }}
      </output>
    </div>

    <input
      [id]="inputId"
      type="range"
      min="1"
      [max]="max()"
      step="1"
      [value]="conversions()"
      class="rly-range mt-3 w-full"
      [attr.aria-valuetext]="conversions() + ' conversiones'"
      (input)="onInput($event)"
    />

    <dl class="mt-5 flex flex-col gap-2.5">
      <div class="flex items-baseline justify-between gap-3">
        <dt class="text-ui text-text-secondary">Comisión base</dt>
        <dd class="text-ui tabular-nums text-ink">{{ estimate().base | rlyMoney }}</dd>
      </div>

      @if (campaign().commission.bonus; as bonus) {
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-ui text-text-secondary">Bono a las {{ bonus.threshold }} conversiones</dt>
          <dd
            class="text-ui tabular-nums"
            [class.text-ink]="estimate().bonus > 0"
            [class.text-text-muted]="estimate().bonus === 0"
          >
            {{ estimate().bonus | rlyMoney }}
          </dd>
        </div>
      }

      <div class="flex items-baseline justify-between gap-3 border-t border-border pt-3">
        <dt class="text-ui font-medium text-ink">Total estimado</dt>
        <dd class="text-title-sm tabular-nums text-ink">{{ estimate().total | rlyMoney }}</dd>
      </div>
    </dl>

    @if (estimate().conversionsToBonus !== null) {
      <p class="mt-3 flex items-start gap-2 text-ui-sm text-text-secondary">
        <rly-icon name="target" [size]="14" class="mt-0.5" />
        <span>
          Te faltarían {{ estimate().conversionsToBonus }} conversiones para el bono de
          {{ campaign().commission.bonus!.amount | rlyMoney }}.
        </span>
      </p>
    }

    <p class="mt-4 text-ui-sm text-text-muted">
      Estimación orientativa. No refleja conversiones reales ni garantiza ingresos: depende del
      volumen, del canal y de la validación de cada conversión por parte de la organización.
    </p>
  `,
  styles: `
    .rly-range {
      appearance: none;
      height: 0.375rem;
      border-radius: 9999px;
      background: var(--rly-color-surface-muted);
      outline: none;
    }

    .rly-range::-webkit-slider-thumb {
      appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 9999px;
      background: var(--rly-color-ink);
      border: 3px solid var(--rly-color-accent);
      cursor: pointer;
    }

    .rly-range::-moz-range-thumb {
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 9999px;
      background: var(--rly-color-ink);
      border: 3px solid var(--rly-color-accent);
      cursor: pointer;
    }

    .rly-range:focus-visible {
      outline: 2px solid var(--rly-color-ink);
      outline-offset: 3px;
    }
  `,
})
export class EarningsCalculator {
  private static sequence = 0;

  protected readonly inputId = `rly-earnings-${++EarningsCalculator.sequence}`;

  readonly campaign = input.required<Campaign>();

  /** Punto de partida: el objetivo declarado por la campaña. */
  readonly conversions = signal(3);

  /** Tope del control: el doble de la meta, con un mínimo razonable. */
  protected readonly max = computed(() => Math.max(10, this.campaign().goal.target * 3));

  protected readonly estimate = computed(() =>
    estimateEarnings(this.campaign(), this.conversions()),
  );

  protected onInput(event: Event): void {
    this.conversions.set(Number((event.target as HTMLInputElement).value));
  }
}
