import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Button } from '@ds/button/button';
import { Checkbox } from '@ds/choice/choice';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { InputField, TextareaField } from '@ds/input/input';
import { Skeleton } from '@ds/skeleton/skeleton';
import { TabNav } from '@ds/tabs/tabs';
import { ToastService } from '@ds/toast/toast.service';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { CHANNELS, ChannelId } from '@data/models/taxonomy';
import { commissionDetail } from '@data/logic/commission';
import { AccessBadge, CampaignStatusBadge } from '@domain/status/status-badges';

/**
 * Configuración de una campaña publicada.
 *
 * Se puede cambiar lo que no altera un acuerdo ya aceptado: el texto, los
 * canales permitidos, el código promocional y la meta. La comisión y el evento
 * de conversión no se editan aquí: cambiarlos con afiliados activos
 * modificaría las condiciones bajo las que aceptaron.
 */
@Component({
  selector: 'rly-campaign-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    Button,
    Checkbox,
    Field,
    Icon,
    InputField,
    TextareaField,
    Skeleton,
    TabNav,
    AccessBadge,
    CampaignStatusBadge,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      @if (campaign.isLoading()) {
        <rly-skeleton shape="block" height="20rem" />
      } @else if (campaign.value(); as item) {
        <header>
          <nav aria-label="Ruta" class="flex flex-wrap items-center gap-1.5 text-ui-sm">
            <a
              [routerLink]="['/app/organization', organizationId(), 'campanas']"
              class="focus-ring rounded-xs text-text-secondary hover:text-ink"
            >
              Campañas
            </a>
            <span class="text-text-muted" aria-hidden="true">/</span>
            <span class="text-text-secondary">{{ item.name }}</span>
          </nav>

          <h2 class="mt-3 text-title-md text-ink">{{ item.name }}</h2>

          <div class="mt-2 flex flex-wrap items-center gap-2">
            <rly-campaign-status [status]="item.status" />
            <rly-access-badge [access]="item.access" internal outline />
          </div>
        </header>

        <rly-tab-nav class="mt-6" [tabs]="tabs()" ariaLabel="Secciones de la campaña" />

        <div class="mx-auto max-w-2xl pt-6">
          <form class="flex flex-col gap-6" [formGroup]="form" (ngSubmit)="save()">
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="contenido"
            >
              <h3 id="contenido" class="text-title-xs text-ink">Contenido</h3>

              <div class="mt-4 flex flex-col gap-5">
                <rly-field
                  label="Nombre"
                  required
                  [error]="errorFor('name', 'Escribe un nombre de al menos 3 caracteres')"
                >
                  <input rlyInput type="text" formControlName="name" />
                </rly-field>

                <rly-field
                  label="Resumen"
                  required
                  [error]="errorFor('summary', 'Escribe un resumen de al menos 20 caracteres')"
                >
                  <input rlyInput type="text" formControlName="summary" />
                </rly-field>

                <rly-field label="Descripción" required>
                  <textarea rlyTextarea rows="6" formControlName="description"></textarea>
                </rly-field>

                <rly-field label="URL de destino" required>
                  <input rlyInput type="url" formControlName="landingUrl" />
                </rly-field>
              </div>
            </section>

            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="canales"
            >
              <h3 id="canales" class="text-title-xs text-ink">Canales permitidos</h3>

              <div class="mt-4 grid gap-2.5 sm:grid-cols-2">
                @for (channel of channels; track channel.id) {
                  <label class="flex items-center gap-2.5 text-ui text-text-secondary">
                    <input
                      rlyCheckbox
                      type="checkbox"
                      [checked]="selectedChannels().includes(channel.id)"
                      (change)="toggleChannel(channel.id)"
                    />
                    {{ channel.label }}
                  </label>
                }
              </div>
            </section>

            <section class="rounded-lg border border-border bg-surface p-5" aria-labelledby="meta">
              <h3 id="meta" class="text-title-xs text-ink">Meta y códigos</h3>

              <div class="mt-4 flex flex-col gap-5">
                <rly-field label="Meta principal">
                  <input rlyInput type="text" formControlName="goalLabel" />
                </rly-field>

                <rly-field label="Objetivo numérico">
                  <input rlyInput type="number" min="1" formControlName="goalTarget" />
                </rly-field>

                <label class="flex items-center gap-3 text-ui text-ink">
                  <input rlyCheckbox type="checkbox" formControlName="promoCodeEnabled" />
                  Generar un código promocional por afiliado
                </label>
              </div>
            </section>

            <!-- Lo que no se toca -->
            <section
              class="rounded-lg border border-border bg-surface-muted p-5"
              aria-labelledby="fijo"
            >
              <h3 id="fijo" class="text-title-xs text-ink">Condiciones acordadas</h3>
              <p class="mt-1 text-ui-sm text-text-secondary">
                No se editan mientras haya afiliados activos: cambiarlas modificaría el acuerdo bajo
                el que aceptaron unirse.
              </p>

              <dl class="mt-4 flex flex-col gap-2.5">
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-ui-sm text-text-secondary">Comisión</dt>
                  <dd class="text-ui text-ink">{{ commission() }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-ui-sm text-text-secondary">Modalidad de acceso</dt>
                  <dd class="text-ui text-ink">
                    <rly-access-badge [access]="item.access" internal />
                  </dd>
                </div>
              </dl>

              <p class="mt-4 flex items-start gap-2 text-ui-sm text-text-muted">
                <rly-icon name="info" [size]="15" class="mt-0.5" />
                Para cambiar la comisión, finaliza esta campaña y publica una nueva.
              </p>
            </section>

            <div class="flex flex-wrap items-center gap-3">
              <button rlyButton variant="primary" type="submit" [loading]="busy()">
                Guardar cambios
              </button>
              @if (saved()) {
                <span class="flex items-center gap-1.5 text-ui-sm text-success-strong">
                  <rly-icon name="check-circle" [size]="15" />
                  Cambios guardados
                </span>
              }
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class CampaignSettingsPage {
  private readonly builder = inject(FormBuilder);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  readonly organizationId = input.required<string>();
  readonly campaignId = input.required<string>();

  protected readonly channels = CHANNELS;
  protected readonly busy = signal(false);
  protected readonly saved = signal(false);
  protected readonly selectedChannels = signal<readonly ChannelId[]>([]);

  protected readonly campaign = rxResource({
    params: () => this.campaignId(),
    stream: ({ params }) => this.catalog.campaign(params),
  });

  protected readonly form: FormGroup = this.builder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    summary: ['', [Validators.required, Validators.minLength(20)]],
    description: ['', Validators.required],
    landingUrl: ['', Validators.required],
    goalLabel: [''],
    goalTarget: [5],
    promoCodeEnabled: [false],
  });

  constructor() {
    effect(() => {
      const campaign = this.campaign.value();
      if (!campaign) return;

      this.form.patchValue(
        {
          name: campaign.name,
          summary: campaign.summary,
          description: campaign.description,
          landingUrl: campaign.landingUrl,
          goalLabel: campaign.goal.label,
          goalTarget: campaign.goal.target,
          promoCodeEnabled: campaign.promoCodeEnabled,
        },
        { emitEvent: false },
      );

      this.selectedChannels.set(campaign.channels);
    });
  }

  protected readonly tabs = computed(() => {
    const base = ['/app/organization', this.organizationId(), 'campanas', this.campaignId()];

    return [
      { label: 'Resumen', link: [...base, 'resumen'] },
      { label: 'Aplicaciones', link: [...base, 'aplicaciones'] },
      { label: 'Afiliados', link: [...base, 'afiliados'] },
      { label: 'Conversiones', link: [...base, 'conversiones'] },
      { label: 'Configuración', link: [...base, 'configuracion'] },
    ];
  });

  protected readonly commission = computed(() => {
    const campaign = this.campaign.value();
    return campaign ? commissionDetail(campaign) : '';
  });

  protected errorFor(name: string, message: string): string | null {
    const control = this.form.get(name);
    return control && control.invalid && control.touched ? message : null;
  }

  protected toggleChannel(channel: ChannelId): void {
    this.selectedChannels.update((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
    this.saved.set(false);
  }

  protected async save(): Promise<void> {
    if (this.busy()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);

    try {
      const values = this.form.getRawValue();

      await firstValueFrom(
        this.catalog.updateCampaign(this.campaignId(), {
          name: values.name,
          summary: values.summary,
          description: values.description,
          landingUrl: values.landingUrl,
          channels: this.selectedChannels(),
          promoCodeEnabled: values.promoCodeEnabled,
          goal: {
            label: values.goalLabel,
            target: Number(values.goalTarget),
            unit: 'conversions',
          },
        }),
      );

      this.campaign.reload();
      this.saved.set(true);
      this.toasts.success('Campaña actualizada');
    } catch {
      this.toasts.error('No se pudieron guardar los cambios');
    } finally {
      this.busy.set(false);
    }
  }
}
