import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Icon } from '@ds/icon/icon';
import { CampaignGoal } from '@data/models/campaign';
import { MoneyPipe, NumberPipe } from '@shared/pipes/format.pipes';

/**
 * Progreso hacia la meta principal de una campaña.
 *
 * Una sola meta por campaña. El mensaje se centra en lo que falta —«te falta
 * 1 conversión»— porque es la única parte accionable del dato.
 */
@Component({
  selector: 'rly-goal-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, MoneyPipe, NumberPipe],
  host: { class: 'block' },
  template: `
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-ui-sm text-text-secondary">Meta de la campaña</p>
        <p class="mt-0.5 text-ui font-medium text-ink">{{ goal().label }}</p>
      </div>

      @if (reached()) {
        <span class="flex items-center gap-1.5 text-ui-sm font-medium text-success-strong">
          <rly-icon name="check-circle" [size]="16" />
          Alcanzada
        </span>
      }
    </div>

    <div
      class="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
      role="progressbar"
      [attr.aria-valuenow]="current()"
      aria-valuemin="0"
      [attr.aria-valuemax]="goal().target"
      [attr.aria-label]="goal().label"
    >
      <div
        class="h-full rounded-full transition-[width] duration-reveal ease-standard"
        [class]="reached() ? 'bg-success' : 'bg-accent'"
        [style.width.%]="percent()"
      ></div>
    </div>

    <p class="mt-2 text-ui-sm text-text-secondary">
      <span class="font-medium tabular-nums text-ink">{{ formatted() }}</span>
      de {{ formattedTarget() }}
      @if (!reached()) {
        · faltan <span class="tabular-nums">{{ formattedRemaining() }}</span>
      }
    </p>
  `,
})
export class GoalProgress {
  readonly goal = input.required<CampaignGoal>();
  readonly current = input.required<number>();

  protected readonly percent = computed(() =>
    Math.min(100, (this.current() / Math.max(1, this.goal().target)) * 100),
  );

  protected readonly reached = computed(() => this.current() >= this.goal().target);

  private readonly money = new MoneyPipe();
  private readonly number = new NumberPipe();

  protected readonly formatted = computed(() => this.format(this.current()));
  protected readonly formattedTarget = computed(() => this.format(this.goal().target));
  protected readonly formattedRemaining = computed(() =>
    this.format(Math.max(0, this.goal().target - this.current())),
  );

  private format(value: number): string {
    return this.goal().unit === 'commission'
      ? this.money.transform(value)
      : this.number.transform(value);
  }
}
