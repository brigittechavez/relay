import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { Checkbox } from '@ds/choice/choice';
import { Drawer } from '@ds/drawer/drawer';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { TextareaField } from '@ds/input/input';
import { Modal } from '@ds/modal/modal';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { Campaign } from '@data/models/campaign';
import { channelLabel, ChannelId } from '@data/models/taxonomy';
import { Eligibility } from '@data/logic/matching';
import { EligibilityChecklist } from '@domain/eligibility/eligibility-checklist';

const MIN_STRATEGY = 60;
const MAX_STRATEGY = 600;

/**
 * Flujo de solicitud a una campaña.
 *
 * La modalidad de acceso decide la forma:
 *
 * - **Abierta**: confirmación en un modal. No hay nada que revisar, así que
 *   pedir un formulario sería fricción sin propósito.
 * - **Selectiva**: panel lateral en escritorio y hoja inferior en móvil, con la
 *   pregunta de estrategia y los canales.
 * - **Premium**: no se resuelve aquí. Se navega a una página dedicada, porque
 *   la propuesta es más larga y merece la pantalla completa.
 *
 * El componente no decide si la persona puede solicitar: recibe la
 * elegibilidad ya evaluada.
 */
@Component({
  selector: 'rly-apply-launcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Badge,
    Button,
    Checkbox,
    Drawer,
    Field,
    Icon,
    TextareaField,
    Modal,
    EligibilityChecklist,
  ],
  host: { class: 'contents' },
  template: `
    <!-- Abierta: confirmación -->
    <rly-modal
      [open]="mode() === 'open' && isOpen()"
      title="Unirte a la campaña"
      [description]="campaign().name"
      size="sm"
      (closed)="close()"
    >
      <p class="text-ui text-text-secondary">
        Esta campaña acepta afiliados de forma inmediata. Al confirmar se generará tu vínculo con la
        campaña
        @if (campaign().promoCodeEnabled) {
          y tu código promocional personal
        }
        , y podrás crear tus links de seguimiento.
      </p>

      <dl class="mt-4 flex flex-col gap-2 rounded-md border border-border bg-canvas p-4">
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-ui-sm text-text-secondary">Comisión</dt>
          <dd class="text-ui text-ink">{{ commissionLabel() }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-ui-sm text-text-secondary">Puedes abandonarla</dt>
          <dd class="text-ui text-ink">Cuando quieras</dd>
        </div>
      </dl>

      <button modalFooter rlyButton variant="ghost" (click)="close()">Cancelar</button>
      <button modalFooter rlyButton variant="primary" [loading]="busy()" (click)="submit()">
        Unirme ahora
      </button>
    </rly-modal>

    <!-- Selectiva: panel lateral / hoja inferior -->
    <rly-drawer
      [open]="mode() === 'selective' && isOpen()"
      title="Solicitar acceso"
      (closed)="close()"
    >
      <p class="text-ui-sm text-text-muted">{{ campaign().name }}</p>
      <p class="mt-1 text-ui text-text-secondary">
        {{ organizationName() }} revisa cada solicitud. Cuenta cómo lo presentarías: es lo que van a
        leer para decidir.
      </p>

      @if (eligibility(); as result) {
        @if (result.missingRecommended.length) {
          <div class="mt-5 rounded-md border border-border bg-canvas p-4">
            <rly-eligibility-checklist [eligibility]="result" />
          </div>
        }
      }

      <form class="mt-5 flex flex-col gap-5">
        @if (campaign().strategyQuestion; as question) {
          <rly-field [label]="question" [hint]="strategyHint()" required [error]="strategyError()">
            <textarea
              rlyTextarea
              rows="6"
              name="strategy"
              [ngModel]="strategy()"
              (ngModelChange)="strategy.set($event)"
            ></textarea>
          </rly-field>
        }

        <fieldset>
          <legend class="text-ui-sm font-medium text-ink">
            ¿En qué canales lo promocionarías?
          </legend>
          <p class="mt-1 text-ui-sm text-text-secondary">
            Solo se muestran los canales que la campaña permite y que tienes en tu perfil.
          </p>

          <div class="mt-3 flex flex-col gap-2.5">
            @for (channel of availableChannels(); track channel) {
              <label class="flex items-center gap-2.5 text-ui text-ink">
                <input
                  rlyCheckbox
                  type="checkbox"
                  [checked]="selectedChannels().includes(channel)"
                  (change)="toggleChannel(channel)"
                />
                {{ channelName(channel) }}
              </label>
            }
          </div>

          @if (!availableChannels().length) {
            <p class="mt-3 text-ui-sm text-warning-strong">
              Ninguno de tus canales coincide con los que admite la campaña. Puedes solicitar
              igualmente, pero es probable que la organización lo tenga en cuenta.
            </p>
          }

          @if (channelsError()) {
            <p class="mt-3 text-ui-sm text-danger-strong">{{ channelsError() }}</p>
          }
        </fieldset>
      </form>

      <button drawerFooter rlyButton variant="ghost" class="flex-1" (click)="close()">
        Cancelar
      </button>
      <button
        drawerFooter
        rlyButton
        variant="primary"
        class="flex-1"
        [loading]="busy()"
        (click)="submit()"
      >
        Enviar solicitud
      </button>
    </rly-drawer>

    <!-- Confirmación tras enviar -->
    <rly-modal
      [open]="submitted()"
      title="Solicitud enviada"
      size="sm"
      (closed)="goToApplication()"
    >
      <div class="flex items-start gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-sm bg-success-soft
                 text-success-strong"
          aria-hidden="true"
        >
          <rly-icon name="check" [size]="20" [strokeWidth]="2.25" />
        </span>

        <div>
          <p class="text-ui text-ink">
            {{ organizationName() }} ha recibido tu solicitud a {{ campaign().name }}.
          </p>
          <p class="mt-2 text-ui-sm text-text-secondary">
            Tiempo medio de revisión: {{ reviewTime() }}. Recibirás un aviso cuando haya respuesta y
            podrás retirarla mientras tanto.
          </p>
          <rly-badge tone="info" class="mt-3">En revisión</rly-badge>
        </div>
      </div>

      <button modalFooter rlyButton variant="primary" (click)="goToApplication()">
        Ver mi solicitud
      </button>
    </rly-modal>
  `,
})
export class ApplyLauncher {
  private readonly engagement = inject(EngagementRepository);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  readonly campaign = input.required<Campaign>();
  readonly eligibility = input<Eligibility | null>(null);
  readonly organizationName = input('La organización');
  readonly reviewTime = input('unos días');

  protected readonly isOpen = signal(false);
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  protected readonly strategy = signal('');
  protected readonly selectedChannels = signal<readonly ChannelId[]>([]);
  private readonly touched = signal(false);
  private createdApplicationId: string | null = null;

  protected readonly mode = computed(() => this.campaign().access);

  /** Intersección entre los canales de la campaña y los del perfil. */
  protected readonly availableChannels = computed(() => {
    const owned = new Set(this.session.affiliate()?.channels.map((channel) => channel.id) ?? []);
    return this.campaign().channels.filter((channel) => owned.has(channel));
  });

  protected readonly commissionLabel = computed(() => {
    const { commission } = this.campaign();

    if (commission.model === 'recurring') {
      return `${commission.percentage}% durante ${commission.recurringMonths} meses`;
    }
    if (commission.model === 'percentage') {
      return `${commission.percentage}% por venta`;
    }
    return `S/ ${commission.amount} por conversión`;
  });

  protected readonly strategyHint = computed(
    () => `Entre ${MIN_STRATEGY} y ${MAX_STRATEGY} caracteres · ${this.strategy().length} escritos`,
  );

  protected readonly strategyError = computed(() => {
    if (!this.touched() || !this.campaign().strategyQuestion) return null;

    const length = this.strategy().trim().length;
    if (length === 0) return 'Responde a la pregunta para poder enviar la solicitud';
    if (length < MIN_STRATEGY) return `Escribe al menos ${MIN_STRATEGY} caracteres`;
    if (length > MAX_STRATEGY) return `Reduce el texto a ${MAX_STRATEGY} caracteres`;

    return null;
  });

  protected readonly channelsError = computed(() =>
    this.touched() && this.availableChannels().length && !this.selectedChannels().length
      ? 'Elige al menos un canal'
      : null,
  );

  /** Punto de entrada desde el detalle de campaña. */
  open(): void {
    this.touched.set(false);
    this.strategy.set('');
    this.selectedChannels.set(this.availableChannels().slice(0, 1));
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected toggleChannel(channel: ChannelId): void {
    this.selectedChannels.update((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
  }

  protected channelName(channel: ChannelId): string {
    return channelLabel(channel);
  }

  protected async submit(): Promise<void> {
    const affiliate = this.session.affiliate();
    if (!affiliate || this.busy()) return;

    this.touched.set(true);

    if (this.mode() === 'selective' && (this.strategyError() || this.channelsError())) {
      return;
    }

    this.busy.set(true);

    try {
      const application = await firstValueFrom(
        this.engagement.apply({
          campaignId: this.campaign().id,
          affiliateId: affiliate.id,
          strategy: this.strategy().trim() || undefined,
          channels: this.selectedChannels(),
        }),
      );

      this.createdApplicationId = application.id;
      this.isOpen.set(false);

      // Una campaña abierta aprueba en el acto: no hay nada que esperar, así
      // que se lleva directamente al espacio de trabajo de la campaña.
      if (application.status === 'approved') {
        this.toasts.success(`Ya estás en ${this.campaign().name}`);
        await this.router.navigate(['/app/affiliate/campanas', this.campaign().id]);
        return;
      }

      this.submitted.set(true);
    } catch {
      this.toasts.error('No se pudo enviar la solicitud');
    } finally {
      this.busy.set(false);
    }
  }

  protected async goToApplication(): Promise<void> {
    this.submitted.set(false);

    if (this.createdApplicationId) {
      await this.router.navigate(['/app/affiliate/aplicaciones', this.createdApplicationId]);
    }
  }
}
