import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Button } from '@ds/button/button';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { TextareaField } from '@ds/input/input';
import { Modal } from '@ds/modal/modal';
import { Skeleton } from '@ds/skeleton/skeleton';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { WITHDRAWABLE } from '@data/models/application';
import { channelLabel } from '@data/models/taxonomy';
import { commissionDetail } from '@data/logic/commission';
import { evaluateEligibility } from '@data/logic/matching';
import { EligibilityChecklist } from '@domain/eligibility/eligibility-checklist';
import { MatchScore } from '@domain/match-score/match-score';
import { ApplicationStatusBadge } from '@domain/status/status-badges';
import { DatePipe, MoneyPipe, RelativeDatePipe } from '@shared/pipes/format.pipes';

/**
 * Detalle de una solicitud.
 *
 * Muestra lo que la organización va a leer y en qué punto está el proceso. Si
 * piden información adicional, se responde desde aquí; si todavía no se ha
 * resuelto, se puede retirar.
 */
@Component({
  selector: 'rly-application-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    Button,
    EmptyState,
    Field,
    Icon,
    TextareaField,
    Modal,
    Skeleton,
    EligibilityChecklist,
    MatchScore,
    ApplicationStatusBadge,
    DatePipe,
    MoneyPipe,
    RelativeDatePipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      @if (application.isLoading()) {
        <div class="mx-auto flex max-w-3xl flex-col gap-4">
          <rly-skeleton width="40%" height="2rem" />
          <rly-skeleton shape="block" height="12rem" />
        </div>
      } @else if (!current()) {
        <rly-empty-state
          icon="applications"
          title="Esta solicitud no existe"
          description="Puede que se haya retirado o que el enlace no sea correcto."
        >
          <a rlyButton variant="primary" routerLink="/app/affiliate/aplicaciones">
            Ver mis solicitudes
          </a>
        </rly-empty-state>
      } @else if (current(); as item) {
        <div class="mx-auto max-w-4xl">
          <nav aria-label="Ruta" class="flex flex-wrap items-center gap-1.5 text-ui-sm">
            <a
              routerLink="/app/affiliate/aplicaciones"
              class="focus-ring rounded-xs text-text-secondary hover:text-ink"
            >
              Solicitudes
            </a>
            <span class="text-text-muted" aria-hidden="true">/</span>
            <span class="text-text-secondary">{{ campaignName() }}</span>
          </nav>

          <header class="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <h2 class="text-title-md text-ink">{{ campaignName() }}</h2>
              <p class="mt-1 text-ui text-text-secondary">{{ organizationName() }}</p>

              <div class="mt-3 flex flex-wrap items-center gap-3">
                <rly-application-status [status]="item.status" />
                <span class="text-ui-sm text-text-muted">
                  Enviada {{ item.submittedAt ?? item.createdAt | rlyRelativeDate }}
                </span>
              </div>
            </div>

            <rly-match-score [value]="item.matchScore" size="lg" />
          </header>

          <!-- Estado del proceso -->
          <section class="mt-8" aria-labelledby="proceso">
            <h3 id="proceso" class="text-title-xs text-ink">Estado</h3>

            <ol class="mt-4 flex flex-col">
              @for (step of steps(); track step.id) {
                <li class="flex gap-4">
                  <span class="flex flex-col items-center">
                    <span [class]="stepMarkClasses(step.state)" aria-hidden="true">
                      @if (step.state === 'done') {
                        <rly-icon name="check" [size]="12" [strokeWidth]="2.5" />
                      }
                    </span>
                    @if (!step.last) {
                      <span
                        class="w-px flex-1"
                        [class.bg-ink]="step.state === 'done'"
                        [class.bg-border]="step.state !== 'done'"
                      ></span>
                    }
                  </span>

                  <span class="flex-1 pb-6" [class.pb-0]="step.last">
                    <span
                      class="block text-ui"
                      [class.text-ink]="step.state !== 'pending'"
                      [class.font-medium]="step.state === 'current'"
                      [class.text-text-muted]="step.state === 'pending'"
                    >
                      {{ step.label }}
                    </span>
                    @if (step.detail) {
                      <span class="mt-0.5 block text-ui-sm text-text-secondary">
                        {{ step.detail }}
                      </span>
                    }
                  </span>
                </li>
              }
            </ol>
          </section>

          @if (item.decisionNote) {
            <section
              class="mt-6 rounded-lg border p-5"
              [class.border-danger]="item.status === 'rejected'"
              [class.bg-danger-soft]="item.status === 'rejected'"
              [class.border-border]="item.status !== 'rejected'"
              [class.bg-surface]="item.status !== 'rejected'"
              aria-labelledby="motivo"
            >
              <h3 id="motivo" class="text-title-xs text-ink">Respuesta de la organización</h3>
              <p class="mt-2 text-ui text-text-secondary">{{ item.decisionNote }}</p>
            </section>
          }

          @if (item.infoRequest) {
            <section
              class="mt-6 rounded-lg border border-warning/40 bg-warning-soft p-5"
              aria-labelledby="info"
            >
              <h3 id="info" class="text-title-xs text-warning-strong">
                {{ organizationName() }} necesita más información
              </h3>
              <p class="mt-2 text-ui text-warning-strong">{{ item.infoRequest }}</p>

              @if (item.infoResponse) {
                <p class="mt-4 rounded-md bg-surface p-4 text-ui text-text-secondary">
                  {{ item.infoResponse }}
                </p>
              } @else {
                <form class="mt-4" (ngSubmit)="respond()">
                  <rly-field label="Tu respuesta" required [error]="responseError()">
                    <textarea
                      rlyTextarea
                      rows="4"
                      name="response"
                      [ngModel]="response()"
                      (ngModelChange)="response.set($event)"
                    ></textarea>
                  </rly-field>

                  <button rlyButton variant="primary" type="submit" class="mt-3" [loading]="busy()">
                    Enviar respuesta
                  </button>
                </form>
              }
            </section>
          }

          <div class="mt-8 grid gap-6 lg:grid-cols-2">
            <!-- Lo que envió -->
            <section class="rounded-lg border border-border bg-surface p-5" aria-labelledby="envio">
              <h3 id="envio" class="text-title-xs text-ink">Lo que enviaste</h3>

              @if (item.strategy) {
                <p class="mt-3 whitespace-pre-line text-ui text-text-secondary">
                  {{ item.strategy }}
                </p>
              } @else {
                <p class="mt-3 text-ui text-text-secondary">
                  Esta campaña no pedía propuesta: la adhesión fue directa.
                </p>
              }

              @if (item.channels.length) {
                <dl class="mt-4 border-t border-border pt-4">
                  <dt class="text-ui-sm text-text-muted">Canales indicados</dt>
                  <dd class="mt-1 text-ui text-ink">{{ channelNames() }}</dd>
                </dl>
              }
            </section>

            <!-- Condiciones y requisitos -->
            <section class="flex flex-col gap-6">
              @if (campaign.value(); as item2) {
                <div class="rounded-lg border border-border bg-surface p-5">
                  <h3 class="text-title-xs text-ink">Condiciones</h3>
                  <dl class="mt-3 flex flex-col gap-2.5">
                    <div class="flex items-baseline justify-between gap-3">
                      <dt class="text-ui-sm text-text-secondary">Comisión</dt>
                      <dd class="text-ui text-ink">{{ commission() }}</dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-3">
                      <dt class="text-ui-sm text-text-secondary">Precio de la oferta</dt>
                      <dd class="text-ui tabular-nums text-ink">{{ item2.price | rlyMoney }}</dd>
                    </div>
                  </dl>

                  <a
                    rlyButton
                    variant="tertiary"
                    size="sm"
                    block
                    class="mt-4"
                    [routerLink]="['/campanas', item2.slug]"
                  >
                    Ver la campaña
                  </a>
                </div>
              }

              @if (eligibility(); as result) {
                <div class="rounded-lg border border-border bg-surface p-5">
                  <rly-eligibility-checklist [eligibility]="result" />
                </div>
              }
            </section>
          </div>

          <!-- Acciones -->
          <div class="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
            @if (item.status === 'approved') {
              <a
                rlyButton
                variant="primary"
                [routerLink]="['/app/affiliate/campanas', item.campaignId]"
              >
                Ir al espacio de la campaña
                <rly-icon name="arrow-right" [size]="16" />
              </a>
            }

            @if (canWithdraw()) {
              <button rlyButton variant="danger" type="button" (click)="withdrawOpen.set(true)">
                Retirar solicitud
              </button>
            }
          </div>
        </div>
      }
    </div>

    <rly-modal
      [open]="withdrawOpen()"
      title="Retirar la solicitud"
      description="Podrás volver a solicitar más adelante."
      size="sm"
      (closed)="withdrawOpen.set(false)"
    >
      <p class="text-ui text-text-secondary">
        {{ organizationName() }} dejará de ver tu solicitud a {{ campaignName() }}. Tu propuesta se
        conservará en el historial pero ya no estará en revisión.
      </p>

      <button modalFooter rlyButton variant="ghost" (click)="withdrawOpen.set(false)">
        Cancelar
      </button>
      <button modalFooter rlyButton variant="danger" [loading]="busy()" (click)="withdraw()">
        Retirar
      </button>
    </rly-modal>
  `,
})
export class ApplicationDetailPage {
  private readonly session = inject(SessionStore);
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  readonly applicationId = input.required<string>();

  protected readonly withdrawOpen = signal(false);
  protected readonly busy = signal(false);
  protected readonly response = signal('');
  private readonly touched = signal(false);

  protected readonly application = rxResource({
    params: () => this.session.affiliate()?.id,
    stream: ({ params }) => this.engagement.listApplications({ affiliateId: params }),
    defaultValue: [],
  });

  protected readonly current = computed(
    () => this.application.value().find((item) => item.id === this.applicationId()) ?? null,
  );

  protected readonly campaign = rxResource({
    params: () => this.current()?.campaignId,
    stream: ({ params }) => this.catalog.campaign(params!),
    defaultValue: undefined,
  });

  private readonly organization = rxResource({
    params: () => this.current()?.organizationId,
    stream: ({ params }) => this.catalog.organization(params!),
    defaultValue: undefined,
  });

  protected readonly campaignName = computed(() => this.campaign.value()?.name ?? 'la campaña');

  protected readonly organizationName = computed(
    () => this.organization.value()?.name ?? 'La organización',
  );

  protected readonly commission = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? commissionDetail(campaign) : '';
  });

  protected readonly channelNames = computed(() =>
    (this.current()?.channels ?? []).map((channel) => channelLabel(channel)).join(', '),
  );

  protected readonly eligibility = computed(() => {
    const affiliate = this.session.affiliate();
    const campaign = this.campaign.value();
    return affiliate && campaign ? evaluateEligibility(affiliate, campaign) : null;
  });

  protected readonly canWithdraw = computed(() => {
    const status = this.current()?.status;
    return status ? WITHDRAWABLE.includes(status) : false;
  });

  protected readonly responseError = computed(() =>
    this.touched() && this.response().trim().length < 10
      ? 'Escribe una respuesta de al menos 10 caracteres'
      : null,
  );

  /**
   * Línea de tiempo del proceso.
   *
   * Se construye a partir del estado actual: no hay eventos guardados para
   * cada paso, y fabricar fechas falsas para rellenarla sería inventar datos.
   */
  protected readonly steps = computed(() => {
    const item = this.current();
    if (!item) return [];

    const date = new DatePipe();
    const decided = item.status === 'approved' || item.status === 'rejected';

    const steps = [
      {
        id: 'sent',
        label: 'Solicitud enviada',
        detail: date.transform(item.submittedAt ?? item.createdAt),
        state: 'done' as const,
        last: false,
      },
      {
        id: 'review',
        label: 'En revisión',
        detail:
          item.status === 'under-review' || item.status === 'info-requested'
            ? `${this.organizationName()} está revisando tu propuesta`
            : '',
        state: decided ? ('done' as const) : ('current' as const),
        last: false,
      },
      {
        id: 'decision',
        label: decisionLabel(item.status),
        detail: decided ? date.transform(item.decidedAt) : '',
        state: decided ? ('done' as const) : ('pending' as const),
        last: true,
      },
    ];

    if (item.status === 'withdrawn') {
      return [
        steps[0],
        { ...steps[1], state: 'done' as const, detail: '' },
        {
          id: 'withdrawn',
          label: 'Retirada por ti',
          detail: '',
          state: 'done' as const,
          last: true,
        },
      ];
    }

    return steps;
  });

  protected stepMarkClasses(state: 'done' | 'current' | 'pending'): string {
    const base = 'grid size-5 shrink-0 place-items-center rounded-full';

    if (state === 'done') return `${base} bg-ink text-accent`;
    if (state === 'current') return `${base} border-2 border-ink bg-surface`;
    return `${base} border border-border bg-surface`;
  }

  protected async withdraw(): Promise<void> {
    const item = this.current();
    if (!item || this.busy()) return;

    this.busy.set(true);

    try {
      await firstValueFrom(this.engagement.decideApplication(item.id, { status: 'withdrawn' }));
      this.application.reload();
      this.withdrawOpen.set(false);
      this.toasts.success('Solicitud retirada');
    } catch {
      this.toasts.error('No se pudo retirar la solicitud');
    } finally {
      this.busy.set(false);
    }
  }

  protected async respond(): Promise<void> {
    const item = this.current();
    if (!item || this.busy()) return;

    this.touched.set(true);
    if (this.responseError()) return;

    this.busy.set(true);

    try {
      await firstValueFrom(
        this.engagement.decideApplication(item.id, {
          status: 'under-review',
          infoResponse: this.response().trim(),
        }),
      );
      this.application.reload();
      this.toasts.success('Respuesta enviada');
    } catch {
      this.toasts.error('No se pudo enviar la respuesta');
    } finally {
      this.busy.set(false);
    }
  }
}

function decisionLabel(status: string): string {
  if (status === 'approved') return 'Aprobada';
  if (status === 'rejected') return 'Rechazada';
  return 'Decisión';
}
