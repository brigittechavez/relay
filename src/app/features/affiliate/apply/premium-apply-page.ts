import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { Checkbox } from '@ds/choice/choice';
import { EmptyState } from '@ds/empty-state/empty-state';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { TextareaField } from '@ds/input/input';
import { Skeleton } from '@ds/skeleton/skeleton';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { channelLabel, ChannelId } from '@data/models/taxonomy';
import { commissionDetail } from '@data/logic/commission';
import { computeMatchScore, evaluateEligibility } from '@data/logic/matching';
import { EligibilityChecklist } from '@domain/eligibility/eligibility-checklist';
import { MatchScore } from '@domain/match-score/match-score';
import { MoneyPipe } from '@shared/pipes/format.pipes';

const MIN_STRATEGY = 120;
const MAX_STRATEGY = 900;

/**
 * Solicitud a una campaña Premium.
 *
 * Página dedicada, no panel: la organización va a leer la propuesta completa
 * antes de decidir y el texto necesita espacio para escribirse. La página
 * muestra al lado los requisitos y la compatibilidad, de modo que quien
 * escribe sepa contra qué se le va a comparar.
 */
@Component({
  selector: 'rly-premium-apply-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    Badge,
    Button,
    Checkbox,
    EmptyState,
    Field,
    Icon,
    TextareaField,
    Skeleton,
    EligibilityChecklist,
    MatchScore,
    MoneyPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      @if (campaign.isLoading()) {
        <div class="mx-auto flex max-w-3xl flex-col gap-4">
          <rly-skeleton width="30%" />
          <rly-skeleton width="60%" height="2rem" />
          <rly-skeleton shape="block" height="14rem" />
        </div>
      } @else if (campaign.error() || !campaign.value()) {
        <rly-empty-state
          icon="alert"
          title="Esta campaña no está disponible"
          description="Puede que se haya archivado o que el enlace no sea correcto."
        >
          <a rlyButton variant="primary" routerLink="/app/affiliate/marketplace">
            Volver al marketplace
          </a>
        </rly-empty-state>
      } @else if (campaign.value(); as item) {
        <div class="mx-auto max-w-5xl">
          <nav aria-label="Ruta" class="flex flex-wrap items-center gap-1.5 text-ui-sm">
            <a
              routerLink="/app/affiliate/marketplace"
              class="focus-ring rounded-xs text-text-secondary hover:text-ink"
            >
              Marketplace
            </a>
            <span class="text-text-muted" aria-hidden="true">/</span>
            <a
              [routerLink]="['/campanas', item.slug]"
              class="focus-ring rounded-xs text-text-secondary hover:text-ink"
            >
              {{ item.name }}
            </a>
            <span class="text-text-muted" aria-hidden="true">/</span>
            <span class="text-text-secondary">Solicitud</span>
          </nav>

          <header class="mt-4">
            <rly-badge tone="accent">Campaña premium</rly-badge>
            <h2 class="mt-3 text-title-md text-ink">Solicitar acceso a {{ item.name }}</h2>
            <p class="mt-2 max-w-2xl text-body-lg text-text-secondary">
              {{ organizationName() }} revisa cada solicitud a fondo. Aprueban alrededor del
              {{ approvalRate() }}% y tardan {{ reviewTime() }} de media.
            </p>
          </header>

          @if (!eligible()) {
            <div
              class="mt-6 flex items-start gap-3 rounded-lg border border-warning/40
                     bg-warning-soft p-5"
            >
              <rly-icon name="alert" [size]="18" class="mt-0.5 text-warning-strong" />
              <div>
                <p class="text-ui font-medium text-warning-strong">
                  Todavía no cumples los requisitos obligatorios
                </p>
                <p class="mt-1 text-ui text-warning-strong">
                  Puedes revisarlos abajo. En cuanto los cumplas podrás enviar la solicitud.
                </p>
              </div>
            </div>
          }

          <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
            <form class="flex min-w-0 flex-col gap-8" (ngSubmit)="submit()">
              <section aria-labelledby="propuesta">
                <h3 id="propuesta" class="text-title-xs text-ink">Tu propuesta</h3>

                <rly-field
                  class="mt-4"
                  [label]="item.strategyQuestion ?? 'Cuenta cómo promocionarías esta campaña'"
                  [hint]="strategyHint()"
                  required
                  [error]="strategyError()"
                >
                  <textarea
                    rlyTextarea
                    rows="10"
                    name="strategy"
                    [ngModel]="strategy()"
                    (ngModelChange)="strategy.set($event)"
                  ></textarea>
                </rly-field>

                <p class="mt-3 text-ui-sm text-text-muted">
                  Concreta a quién llegarías, con qué formato y por qué encaja con tu audiencia.
                  Evita generalidades: es lo que diferencia una propuesta aprobada de una rechazada.
                </p>
              </section>

              <section aria-labelledby="canales">
                <h3 id="canales" class="text-title-xs text-ink">Canales</h3>
                <p class="mt-1 text-ui-sm text-text-secondary">
                  Esta campaña admite: {{ allowedChannelNames() }}.
                </p>

                <div class="mt-4 flex flex-col gap-2.5">
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
                    Ninguno de tus canales coincide con los admitidos.
                  </p>
                }

                @if (channelsError()) {
                  <p class="mt-3 text-ui-sm text-danger-strong">{{ channelsError() }}</p>
                }
              </section>

              <div class="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                <button
                  rlyButton
                  variant="primary"
                  type="submit"
                  [loading]="busy()"
                  [disabled]="!eligible()"
                >
                  Enviar solicitud
                </button>
                <a rlyButton variant="ghost" [routerLink]="['/campanas', item.slug]">
                  Volver a la campaña
                </a>
              </div>
            </form>

            <aside class="flex flex-col gap-6">
              <div class="rounded-lg border border-border bg-surface p-5">
                <p class="text-ui-sm text-text-muted">Comisión</p>
                <p class="mt-1 text-title-sm text-ink">{{ commission() }}</p>
                <p class="mt-1 text-ui-sm text-text-secondary">Sobre {{ item.price | rlyMoney }}</p>

                @if (matchScore() !== null) {
                  <div class="mt-5 flex items-center gap-3 border-t border-border pt-5">
                    <rly-match-score [value]="matchScore()!" size="lg" [showLabel]="false" />
                    <div>
                      <p class="text-ui font-medium text-ink">
                        {{ matchScore() }}% de compatibilidad
                      </p>
                      <p class="text-ui-sm text-text-secondary">Según tu perfil</p>
                    </div>
                  </div>
                }
              </div>

              @if (eligibility(); as result) {
                <div class="rounded-lg border border-border bg-surface p-5">
                  <rly-eligibility-checklist [eligibility]="result" />
                </div>
              }
            </aside>
          </div>
        </div>
      }
    </div>
  `,
})
export class PremiumApplyPage {
  private readonly catalog = inject(CatalogRepository);
  private readonly engagement = inject(EngagementRepository);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  readonly slug = input.required<string>();

  protected readonly campaign = rxResource({
    params: () => this.slug(),
    stream: ({ params }) => this.catalog.campaign(params),
  });

  private readonly organization = rxResource({
    params: () => this.campaign.value()?.organizationId,
    stream: ({ params }) => this.catalog.organization(params!),
    defaultValue: undefined,
  });

  protected readonly strategy = signal('');
  protected readonly selectedChannels = signal<readonly ChannelId[]>([]);
  protected readonly busy = signal(false);
  private readonly touched = signal(false);

  protected readonly organizationName = computed(
    () => this.organization.value()?.name ?? 'La organización',
  );

  protected readonly approvalRate = computed(
    () => this.organization.value()?.metrics.approvalRate ?? 0,
  );

  protected readonly reviewTime = computed(() => {
    const days = this.organization.value()?.metrics.averageReviewDays;
    return days ? `${days} días` : 'unos días';
  });

  protected readonly eligibility = computed(() => {
    const affiliate = this.session.affiliate();
    const campaign = this.campaign.value();
    return affiliate && campaign ? evaluateEligibility(affiliate, campaign) : null;
  });

  protected readonly eligible = computed(() => this.eligibility()?.eligible === true);

  protected readonly matchScore = computed(() => {
    const affiliate = this.session.affiliate();
    const campaign = this.campaign.value();
    return affiliate && campaign ? computeMatchScore(affiliate, campaign) : null;
  });

  protected readonly commission = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? commissionDetail(campaign) : '';
  });

  protected readonly availableChannels = computed(() => {
    const owned = new Set(this.session.affiliate()?.channels.map((channel) => channel.id) ?? []);
    return (this.campaign.value()?.channels ?? []).filter((channel) => owned.has(channel));
  });

  protected readonly allowedChannelNames = computed(() =>
    (this.campaign.value()?.channels ?? []).map((channel) => channelLabel(channel)).join(', '),
  );

  protected readonly strategyHint = computed(
    () => `Entre ${MIN_STRATEGY} y ${MAX_STRATEGY} caracteres · ${this.strategy().length} escritos`,
  );

  protected readonly strategyError = computed(() => {
    if (!this.touched()) return null;

    const length = this.strategy().trim().length;
    if (length === 0) return 'Escribe tu propuesta para poder enviar la solicitud';
    if (length < MIN_STRATEGY) return `Escribe al menos ${MIN_STRATEGY} caracteres`;
    if (length > MAX_STRATEGY) return `Reduce el texto a ${MAX_STRATEGY} caracteres`;

    return null;
  });

  protected readonly channelsError = computed(() =>
    this.touched() && this.availableChannels().length && !this.selectedChannels().length
      ? 'Elige al menos un canal'
      : null,
  );

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
    const campaign = this.campaign.value();
    if (!affiliate || !campaign || this.busy()) return;

    this.touched.set(true);
    if (this.strategyError() || this.channelsError() || !this.eligible()) return;

    this.busy.set(true);

    try {
      const application = await firstValueFrom(
        this.engagement.apply({
          campaignId: campaign.id,
          affiliateId: affiliate.id,
          strategy: this.strategy().trim(),
          channels: this.selectedChannels(),
        }),
      );

      this.toasts.success('Solicitud enviada');
      await this.router.navigate(['/app/affiliate/aplicaciones', application.id]);
    } catch {
      this.toasts.error('No se pudo enviar la solicitud');
    } finally {
      this.busy.set(false);
    }
  }
}
