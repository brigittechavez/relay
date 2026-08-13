import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Button } from '@ds/button/button';
import { Drawer } from '@ds/drawer/drawer';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { TextareaField } from '@ds/input/input';
import { ToastService } from '@ds/toast/toast.service';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { Affiliate } from '@data/models/affiliate';
import { Application } from '@data/models/application';
import { Campaign } from '@data/models/campaign';
import { channelLabel } from '@data/models/taxonomy';
import { evaluateEligibility } from '@data/logic/matching';
import { EligibilityChecklist } from '@domain/eligibility/eligibility-checklist';
import { MatchScore } from '@domain/match-score/match-score';
import { ApplicationStatusBadge } from '@domain/status/status-badges';
import { CompactPipe, PercentPipe, RelativeDatePipe } from '@shared/pipes/format.pipes';

type Decision = 'approved' | 'rejected' | 'info-requested';

/**
 * Revisión de una solicitud.
 *
 * Panel lateral con todo lo que hace falta para decidir sin cambiar de página:
 * la propuesta, el perfil de quien la envía y los requisitos evaluados. Las
 * tres salidas —aprobar, pedir información, rechazar— piden un motivo cuando
 * la decisión afecta a la otra parte.
 */
@Component({
  selector: 'rly-application-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    Button,
    Drawer,
    Field,
    Icon,
    TextareaField,
    EligibilityChecklist,
    MatchScore,
    ApplicationStatusBadge,
    CompactPipe,
    PercentPipe,
    RelativeDatePipe,
  ],
  host: { class: 'contents' },
  template: `
    <rly-drawer [open]="open()" title="Revisar solicitud" side="right" (closed)="closed.emit()">
      @if (application(); as item) {
        <!-- Quién solicita -->
        @if (affiliate(); as person) {
          <div class="flex items-start gap-3">
            <span
              class="grid size-11 shrink-0 place-items-center rounded-md bg-ink text-ui
                     font-semibold text-text-inverse"
              aria-hidden="true"
            >
              {{ person.initials }}
            </span>

            <div class="min-w-0 flex-1">
              <a
                [routerLink]="['/afiliados', person.slug]"
                [queryParams]="{ campana: campaign()?.slug }"
                class="focus-ring block truncate rounded-xs text-ui font-medium text-ink
                       hover:underline"
              >
                {{ person.name }}
              </a>
              <p class="truncate text-ui-sm text-text-secondary">{{ person.headline }}</p>
            </div>

            <rly-match-score [value]="item.matchScore" size="md" [showLabel]="false" />
          </div>

          <dl class="mt-4 grid grid-cols-3 gap-3 border-y border-border py-3">
            <div>
              <dt class="text-ui-sm text-text-muted">Audiencia</dt>
              <dd class="text-ui tabular-nums text-ink">{{ audience() | rlyCompact }}</dd>
            </div>
            <div>
              <dt class="text-ui-sm text-text-muted">Conversión</dt>
              <dd class="text-ui tabular-nums text-ink">
                {{ person.averageConversionRate | rlyPercent: 2 }}
              </dd>
            </div>
            <div>
              <dt class="text-ui-sm text-text-muted">Relay Score</dt>
              <dd class="text-ui tabular-nums text-ink">{{ person.relayScore }}</dd>
            </div>
          </dl>
        }

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <rly-application-status [status]="item.status" />
          <span class="text-ui-sm text-text-muted">
            Enviada {{ item.submittedAt ?? item.createdAt | rlyRelativeDate }}
          </span>
        </div>

        <!-- Propuesta -->
        @if (item.strategy) {
          <section class="mt-6" aria-labelledby="propuesta">
            <h3 id="propuesta" class="text-title-xs text-ink">Su propuesta</h3>
            <p class="mt-2 whitespace-pre-line text-ui text-text-secondary">{{ item.strategy }}</p>
          </section>
        }

        @if (item.channels.length) {
          <section class="mt-5" aria-labelledby="canales">
            <h3 id="canales" class="text-ui-sm font-medium text-ink">Canales que usaría</h3>
            <p class="mt-1 text-ui text-text-secondary">{{ channelNames() }}</p>
          </section>
        }

        <!-- Requisitos -->
        @if (eligibility(); as result) {
          <section class="mt-6 rounded-md border border-border bg-canvas p-4">
            <rly-eligibility-checklist [eligibility]="result" />
          </section>
        }

        @if (item.infoResponse) {
          <section class="mt-6 rounded-md border border-border bg-surface-muted p-4">
            <h3 class="text-ui-sm font-medium text-ink">Respuesta a tu petición</h3>
            <p class="mt-2 text-ui text-text-secondary">{{ item.infoResponse }}</p>
          </section>
        }

        <!-- Decisión -->
        @if (pending()) {
          <section class="mt-6" aria-labelledby="decision">
            <h3 id="decision" class="text-title-xs text-ink">Tu decisión</h3>

            <div class="mt-3 flex flex-col gap-2">
              @for (option of decisions; track option.id) {
                <label [class]="optionClasses(decision() === option.id)">
                  <input
                    type="radio"
                    class="sr-only"
                    name="decision"
                    [value]="option.id"
                    [checked]="decision() === option.id"
                    (change)="decision.set(option.id)"
                  />
                  <span class="block text-ui font-medium text-ink">{{ option.label }}</span>
                  <span class="mt-0.5 block text-ui-sm text-text-secondary">{{ option.hint }}</span>
                </label>
              }
            </div>

            @if (decision() !== 'approved') {
              <rly-field
                class="mt-4"
                [label]="noteLabel()"
                [hint]="noteHint()"
                required
                [error]="noteError()"
              >
                <textarea
                  rlyTextarea
                  rows="3"
                  name="note"
                  [ngModel]="note()"
                  (ngModelChange)="note.set($event)"
                ></textarea>
              </rly-field>
            } @else {
              <p class="mt-4 flex items-start gap-2 text-ui-sm text-text-secondary">
                <rly-icon name="info" [size]="15" class="mt-0.5 text-info" />
                <span>
                  Al aprobar se crea el vínculo con la campaña
                  @if (campaign()?.promoCodeEnabled) {
                    y su código promocional
                  }
                  , y podrá generar sus links de inmediato.
                </span>
              </p>
            }
          </section>
        } @else if (item.decisionNote) {
          <section class="mt-6 rounded-md border border-border bg-surface-muted p-4">
            <h3 class="text-ui-sm font-medium text-ink">Motivo que indicaste</h3>
            <p class="mt-2 text-ui text-text-secondary">{{ item.decisionNote }}</p>
          </section>
        }
      }

      <button drawerFooter rlyButton variant="ghost" class="flex-1" (click)="closed.emit()">
        Cerrar
      </button>

      @if (pending()) {
        <button
          drawerFooter
          rlyButton
          [variant]="decision() === 'rejected' ? 'danger' : 'primary'"
          class="flex-1"
          [loading]="busy()"
          (click)="submit()"
        >
          {{ actionLabel() }}
        </button>
      }
    </rly-drawer>
  `,
})
export class ApplicationReview {
  private readonly engagement = inject(EngagementRepository);
  private readonly toasts = inject(ToastService);

  readonly open = input(false);
  readonly application = input<Application | null>(null);
  readonly affiliate = input<Affiliate | null>(null);
  readonly campaign = input<Campaign | null>(null);

  readonly closed = output<void>();
  readonly decided = output<void>();

  protected readonly decision = signal<Decision>('approved');
  protected readonly note = signal('');
  protected readonly busy = signal(false);
  private readonly touched = signal(false);

  protected readonly decisions: readonly { id: Decision; label: string; hint: string }[] = [
    { id: 'approved', label: 'Aprobar', hint: 'Se une a la campaña y recibe sus links' },
    {
      id: 'info-requested',
      label: 'Pedir más información',
      hint: 'La solicitud sigue abierta y recibe tu pregunta',
    },
    {
      id: 'rejected',
      label: 'Rechazar',
      hint: 'Se cierra la solicitud con el motivo que indiques',
    },
  ];

  protected readonly pending = computed(() => {
    const status = this.application()?.status;
    return status === 'submitted' || status === 'under-review' || status === 'info-requested';
  });

  protected readonly audience = computed(() =>
    (this.affiliate()?.channels ?? []).reduce((total, channel) => total + channel.audience, 0),
  );

  protected readonly channelNames = computed(() =>
    (this.application()?.channels ?? []).map((channel) => channelLabel(channel)).join(', '),
  );

  protected readonly eligibility = computed(() => {
    const affiliate = this.affiliate();
    const campaign = this.campaign();
    return affiliate && campaign ? evaluateEligibility(affiliate, campaign) : null;
  });

  protected readonly noteLabel = computed(() =>
    this.decision() === 'rejected' ? 'Motivo del rechazo' : 'Qué necesitas saber',
  );

  protected readonly noteHint = computed(() =>
    this.decision() === 'rejected'
      ? 'Breve y concreto. La persona lo verá en su solicitud.'
      : 'Se le mostrará para que pueda responder sin volver a solicitar.',
  );

  protected readonly noteError = computed(() =>
    this.touched() && this.note().trim().length < 10
      ? 'Escribe un motivo de al menos 10 caracteres'
      : null,
  );

  protected readonly actionLabel = computed(
    () =>
      ({
        approved: 'Aprobar solicitud',
        'info-requested': 'Enviar pregunta',
        rejected: 'Rechazar solicitud',
      })[this.decision()],
  );

  protected optionClasses(selected: boolean): string {
    return [
      'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
      'focus-within:outline-ink cursor-pointer rounded-md border p-3',
      'transition-[border-color] duration-micro',
      selected ? 'border-ink bg-surface' : 'border-border bg-surface hover:border-border-strong',
    ].join(' ');
  }

  protected async submit(): Promise<void> {
    const application = this.application();
    if (!application || this.busy()) return;

    this.touched.set(true);
    if (this.decision() !== 'approved' && this.noteError()) return;

    this.busy.set(true);

    try {
      const decision = this.decision();

      await firstValueFrom(
        this.engagement.decideApplication(application.id, {
          status: decision,
          decisionNote: decision === 'rejected' ? this.note().trim() : undefined,
          infoRequest: decision === 'info-requested' ? this.note().trim() : undefined,
        }),
      );

      this.toasts.success(
        {
          approved: 'Solicitud aprobada',
          'info-requested': 'Pregunta enviada',
          rejected: 'Solicitud rechazada',
        }[decision],
      );

      this.note.set('');
      this.touched.set(false);
      this.decision.set('approved');
      this.decided.emit();
    } catch {
      this.toasts.error('No se pudo registrar la decisión');
    } finally {
      this.busy.set(false);
    }
  }
}
