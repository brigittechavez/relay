import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Icon } from '@ds/icon/icon';
import { Eligibility } from '@data/logic/matching';

/**
 * Lista de requisitos de una campaña frente al perfil.
 *
 * Separa lo obligatorio de lo recomendado porque significan cosas distintas:
 * lo primero bloquea la solicitud y lo segundo solo pesa en la revisión. Cada
 * requisito sin cumplir dice además qué falta exactamente, que es la única
 * forma de que la lista sirva para algo.
 */
@Component({
  selector: 'rly-eligibility-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <div class="flex items-baseline justify-between gap-3">
      <h3 class="text-title-xs text-ink">Requisitos</h3>
      <p class="text-ui-sm text-text-secondary">
        <span class="font-medium tabular-nums text-ink">{{ eligibility().metCount }}</span>
        de
        <span class="tabular-nums">{{ eligibility().total }}</span>
      </p>
    </div>

    <ul class="mt-3 flex flex-col gap-2.5">
      @for (check of ordered(); track check.requirement.id) {
        <li class="flex items-start gap-2.5">
          <span [class]="markClasses(check.met)" aria-hidden="true">
            <rly-icon [name]="check.met ? 'check' : 'close'" [size]="12" [strokeWidth]="2.5" />
          </span>

          <span class="min-w-0 flex-1">
            <span
              class="block text-ui"
              [class.text-ink]="check.met"
              [class.text-text-secondary]="!check.met"
            >
              {{ check.requirement.label }}
              @if (!check.requirement.mandatory) {
                <span class="text-text-muted">· recomendado</span>
              }
            </span>

            @if (!check.met && check.detail) {
              <span class="block text-ui-sm text-text-muted">{{ check.detail }}</span>
            }
          </span>

          <span class="sr-only">{{ check.met ? 'Cumplido' : 'Pendiente' }}</span>
        </li>
      }
    </ul>

    @if (!eligibility().eligible) {
      <p
        class="mt-4 flex items-start gap-2 rounded-sm border border-warning/35 bg-warning-soft px-3
               py-2.5 text-ui-sm text-warning-strong"
      >
        <rly-icon name="alert" [size]="15" class="mt-px" />
        <span>
          Te falta {{ eligibility().missingMandatory.length }}
          {{
            eligibility().missingMandatory.length === 1
              ? 'requisito obligatorio'
              : 'requisitos obligatorios'
          }}
          para poder solicitar esta campaña.
        </span>
      </p>
    }
  `,
})
export class EligibilityChecklist {
  readonly eligibility = input.required<Eligibility>();

  /** Lo pendiente y obligatorio primero: es lo que hay que resolver. */
  protected readonly ordered = computed(() => {
    const checks = [...this.eligibility().checks];

    return checks.sort((a, b) => {
      if (a.met !== b.met) return a.met ? 1 : -1;
      if (a.requirement.mandatory !== b.requirement.mandatory) {
        return a.requirement.mandatory ? -1 : 1;
      }
      return 0;
    });
  });

  protected markClasses(met: boolean): string {
    return [
      'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full',
      met ? 'bg-ink text-accent' : 'border border-border-strong text-text-muted',
    ].join(' ');
  }
}
