import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Button } from '@ds/button/button';
import { Checkbox } from '@ds/choice/choice';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { InputField, TextareaField } from '@ds/input/input';
import { Logo } from '@ds/logo/logo';
import { Select, SelectField } from '@ds/select/select';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { OrganizationKind, ORGANIZATION_KIND_LABELS } from '@data/models/organization';
import {
  AFFILIATE_TYPE_LABELS,
  AffiliateType,
  CATEGORIES,
  CHANNELS,
  ChannelId,
  NICHE_LABELS,
  NicheId,
} from '@data/models/taxonomy';

type Path = 'affiliate' | 'organization';

const AFFILIATE_TYPES = Object.keys(AFFILIATE_TYPE_LABELS) as AffiliateType[];
const ORGANIZATION_KINDS = Object.keys(ORGANIZATION_KIND_LABELS) as OrganizationKind[];
const NICHES = Object.keys(NICHE_LABELS) as NicheId[];

/**
 * Onboarding.
 *
 * Cuatro pasos como máximo y una sola bifurcación: quien entra decide si va a
 * promocionar o a publicar, y a partir de ahí solo ve los campos de su
 * recorrido. Elegir «afiliado» no cierra la otra puerta: la organización se
 * puede crear después desde el selector de contexto.
 *
 * Los datos que se recogen aquí no son decorativos: alimentan el match, la
 * elegibilidad y la completitud de perfil desde el primer momento.
 */
@Component({
  selector: 'rly-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Button,
    Checkbox,
    Field,
    Icon,
    InputField,
    TextareaField,
    Logo,
    Select,
    SelectField,
  ],
  host: { class: 'flex min-h-dvh flex-col bg-canvas' },
  template: `
    <header class="border-b border-border bg-surface">
      <div class="container-page flex h-header items-center justify-between gap-4">
        <rly-logo />

        <p class="text-ui-sm text-text-secondary">
          Paso <span class="tabular-nums text-ink">{{ step() + 1 }}</span> de
          <span class="tabular-nums">{{ totalSteps() }}</span>
        </p>
      </div>

      <div class="h-1 bg-surface-muted">
        <div
          class="h-full bg-accent transition-[width] duration-ui ease-standard"
          [style.width.%]="progress()"
          role="progressbar"
          [attr.aria-valuenow]="step() + 1"
          aria-valuemin="1"
          [attr.aria-valuemax]="totalSteps()"
          aria-label="Progreso del onboarding"
        ></div>
      </div>
    </header>

    <main class="container-page flex-1 py-10 lg:py-14">
      <div class="mx-auto max-w-xl">
        @switch (step()) {
          <!-- 1 · Elección de recorrido -->
          @case (0) {
            <h1 class="text-title-lg text-ink">¿Cómo vas a usar RELAY?</h1>
            <p class="mt-3 text-body-lg text-text-secondary">
              Puedes cambiar de contexto después: esto solo decide por dónde empezamos.
            </p>

            <div class="mt-8 flex flex-col gap-3">
              <button
                type="button"
                [class]="optionClasses(path() === 'affiliate')"
                (click)="choose('affiliate')"
              >
                <span
                  class="grid size-10 shrink-0 place-items-center rounded-sm bg-accent text-accent-contrast"
                >
                  <rly-icon name="profile" [size]="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-title-xs text-ink">Quiero promocionar campañas</span>
                  <span class="mt-1 block text-ui text-text-secondary">
                    Tengo audiencia, comunidad o clientes a los que puedo recomendar servicios y
                    productos.
                  </span>
                </span>
                @if (path() === 'affiliate') {
                  <rly-icon name="check-circle" [size]="20" class="mt-1 text-ink" />
                }
              </button>

              <button
                type="button"
                [class]="optionClasses(path() === 'organization')"
                (click)="choose('organization')"
              >
                <span
                  class="grid size-10 shrink-0 place-items-center rounded-sm bg-ink text-accent"
                >
                  <rly-icon name="organization" [size]="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-title-xs text-ink">Quiero publicar un programa</span>
                  <span class="mt-1 block text-ui text-text-secondary">
                    Vendo un servicio, producto o suscripción y busco quién lo recomiende a cambio
                    de comisión.
                  </span>
                </span>
                @if (path() === 'organization') {
                  <rly-icon name="check-circle" [size]="20" class="mt-1 text-ink" />
                }
              </button>
            </div>
          }

          <!-- 2 · Datos principales -->
          @case (1) {
            @if (path() === 'affiliate') {
              <h1 class="text-title-lg text-ink">Cuéntanos qué haces</h1>
              <p class="mt-3 text-body-lg text-text-secondary">
                Esto define con qué campañas encajas: el nicho es lo que más pesa en la
                compatibilidad.
              </p>

              <form [formGroup]="affiliateForm" class="mt-8 flex flex-col gap-6">
                <rly-field label="¿Cómo te describirías?" required>
                  <rly-select>
                    <select rlySelect formControlName="type">
                      @for (type of affiliateTypes; track type) {
                        <option [value]="type">{{ typeLabel(type) }}</option>
                      }
                    </select>
                  </rly-select>
                </rly-field>

                <rly-field
                  label="Titular"
                  hint="Una línea sobre lo que publicas. Aparece en tu perfil público."
                  required
                  [error]="errorFor(affiliateForm, 'headline', 'Escribe un titular breve')"
                >
                  <input
                    rlyInput
                    type="text"
                    formControlName="headline"
                    placeholder="Contenido sobre herramientas para trabajar mejor"
                  />
                </rly-field>

                <rly-field label="Ciudad y país" required>
                  <input rlyInput type="text" formControlName="location" placeholder="Lima, Perú" />
                </rly-field>

                <fieldset>
                  <legend class="text-ui-sm font-medium text-ink">
                    Nichos <span class="font-normal text-text-muted">· elige hasta cinco</span>
                  </legend>
                  <div class="mt-3 grid gap-2.5 sm:grid-cols-2">
                    @for (niche of niches; track niche) {
                      <label class="flex items-center gap-2.5 text-ui text-text-secondary">
                        <input
                          rlyCheckbox
                          type="checkbox"
                          [checked]="selectedNiches().includes(niche)"
                          [disabled]="
                            !selectedNiches().includes(niche) && selectedNiches().length >= 5
                          "
                          (change)="toggleNiche(niche)"
                        />
                        {{ nicheLabel(niche) }}
                      </label>
                    }
                  </div>
                </fieldset>
              </form>
            } @else {
              <h1 class="text-title-lg text-ink">Sobre tu organización</h1>
              <p class="mt-3 text-body-lg text-text-secondary">
                Es lo que verá quien se plantee promocionar tus campañas.
              </p>

              <form [formGroup]="organizationForm" class="mt-8 flex flex-col gap-6">
                <rly-field
                  label="Nombre"
                  required
                  [error]="
                    errorFor(organizationForm, 'name', 'Escribe el nombre de tu organización')
                  "
                >
                  <input rlyInput type="text" formControlName="name" placeholder="Norte Digital" />
                </rly-field>

                <rly-field label="Tipo" required>
                  <rly-select>
                    <select rlySelect formControlName="kind">
                      @for (kind of organizationKinds; track kind) {
                        <option [value]="kind">{{ kindLabel(kind) }}</option>
                      }
                    </select>
                  </rly-select>
                </rly-field>

                <rly-field label="Industria" required>
                  <rly-select>
                    <select rlySelect formControlName="categoryId">
                      @for (category of categories; track category.id) {
                        <option [value]="category.id">{{ category.label }}</option>
                      }
                    </select>
                  </rly-select>
                </rly-field>

                <rly-field
                  label="Qué vendes"
                  hint="Una línea. Aparece bajo el nombre en tu perfil público."
                  required
                  [error]="errorFor(organizationForm, 'tagline', 'Describe tu oferta en una línea')"
                >
                  <input
                    rlyInput
                    type="text"
                    formControlName="tagline"
                    placeholder="Landing pages para negocios y especialistas"
                  />
                </rly-field>
              </form>
            }
          }

          <!-- 3 · Detalle -->
          @case (2) {
            @if (path() === 'affiliate') {
              <h1 class="text-title-lg text-ink">¿Dónde publicas?</h1>
              <p class="mt-3 text-body-lg text-text-secondary">
                Muchas campañas limitan los canales permitidos. Declarar los tuyos evita que
                aparezcan oportunidades en las que no podrías participar.
              </p>

              <div class="mt-8 flex flex-col gap-3">
                @for (channel of channels; track channel.id) {
                  <div class="rounded-md border border-border bg-surface p-4">
                    <label class="flex items-center gap-3 text-ui text-ink">
                      <input
                        rlyCheckbox
                        type="checkbox"
                        [checked]="hasChannel(channel.id)"
                        (change)="toggleChannel(channel.id)"
                      />
                      <rly-icon [name]="channel.icon" [size]="16" class="text-text-secondary" />
                      {{ channel.label }}
                    </label>

                    @if (hasChannel(channel.id)) {
                      <div class="mt-3 grid gap-3 pl-8 sm:grid-cols-2">
                        <label class="block">
                          <span class="mb-1.5 block text-ui-sm text-text-secondary">Usuario</span>
                          <input
                            rlyInput
                            compact
                            type="text"
                            [value]="handleFor(channel.id)"
                            placeholder="@tucuenta"
                            (input)="setHandle(channel.id, $event)"
                          />
                        </label>
                        <label class="block">
                          <span class="mb-1.5 block text-ui-sm text-text-secondary">Audiencia</span>
                          <input
                            rlyInput
                            compact
                            type="number"
                            min="0"
                            [value]="audienceFor(channel.id)"
                            placeholder="0"
                            (input)="setAudience(channel.id, $event)"
                          />
                        </label>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <h1 class="text-title-lg text-ink">Un poco más de contexto</h1>
              <p class="mt-3 text-body-lg text-text-secondary">
                Con esto tu perfil público queda listo para recibir solicitudes.
              </p>

              <form [formGroup]="organizationForm" class="mt-8 flex flex-col gap-6">
                <rly-field
                  label="Descripción"
                  hint="Dos o tres frases sobre qué hacéis y para quién"
                >
                  <textarea rlyTextarea rows="4" formControlName="description"></textarea>
                </rly-field>

                <rly-field label="Sitio web" optionalHint>
                  <input
                    rlyInput
                    type="text"
                    formControlName="website"
                    placeholder="tuempresa.pe"
                  />
                </rly-field>

                <rly-field label="Ubicación" required>
                  <input rlyInput type="text" formControlName="location" placeholder="Lima, Perú" />
                </rly-field>
              </form>
            }
          }

          <!-- 4 · Listo -->
          @case (3) {
            <div class="text-center">
              <span
                class="mx-auto grid size-14 place-items-center rounded-lg bg-accent
                       text-accent-contrast"
                aria-hidden="true"
              >
                <rly-icon name="check" [size]="26" [strokeWidth]="2.25" />
              </span>

              <h1 class="mt-6 text-title-lg text-ink">Tu workspace está listo</h1>
              <p class="mx-auto mt-3 max-w-md text-body-lg text-text-secondary">
                {{ summary() }}
              </p>

              <div
                class="mx-auto mt-8 max-w-sm rounded-lg border border-border bg-surface p-5 text-left"
              >
                <p class="text-ui-sm text-text-muted">Siguiente paso sugerido</p>
                <p class="mt-1 text-ui text-ink">{{ nextStepHint() }}</p>
              </div>
            </div>
          }
        }

        <!-- Navegación -->
        <div class="mt-10 flex items-center justify-between gap-3">
          <button
            rlyButton
            variant="ghost"
            type="button"
            [disabled]="step() === 0 || busy()"
            (click)="back()"
          >
            <rly-icon name="arrow-left" [size]="16" />
            Atrás
          </button>

          <div class="flex items-center gap-2">
            @if (step() > 0 && step() < 3) {
              <button rlyButton variant="ghost" type="button" [disabled]="busy()" (click)="skip()">
                Completar después
              </button>
            }

            <button
              rlyButton
              variant="primary"
              type="button"
              [loading]="busy()"
              [disabled]="!canContinue()"
              (click)="next()"
            >
              {{ step() === 3 ? 'Entrar en RELAY' : 'Continuar' }}
              @if (step() !== 3) {
                <rly-icon name="arrow-right" [size]="16" />
              }
            </button>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class OnboardingPage {
  private readonly builder = inject(FormBuilder);
  private readonly session = inject(SessionStore);
  private readonly catalog = inject(CatalogRepository);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly affiliateTypes = AFFILIATE_TYPES;
  protected readonly organizationKinds = ORGANIZATION_KINDS;
  protected readonly categories = CATEGORIES;
  protected readonly channels = CHANNELS;
  protected readonly niches = NICHES;

  protected readonly step = signal(0);
  protected readonly path = signal<Path>('affiliate');
  protected readonly busy = signal(false);

  protected readonly selectedNiches = signal<readonly NicheId[]>([]);
  private readonly selectedChannels = signal<
    readonly { id: ChannelId; handle: string; audience: number }[]
  >([]);

  protected readonly affiliateForm = this.builder.nonNullable.group({
    type: ['creator' as AffiliateType, Validators.required],
    headline: ['', [Validators.required, Validators.minLength(8)]],
    location: ['Lima, Perú', Validators.required],
  });

  protected readonly organizationForm = this.builder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    kind: ['company' as OrganizationKind, Validators.required],
    categoryId: ['servicios', Validators.required],
    tagline: ['', [Validators.required, Validators.minLength(8)]],
    description: [''],
    website: [''],
    location: ['Lima, Perú', Validators.required],
  });

  protected readonly totalSteps = () => 4;

  protected readonly progress = computed(() => ((this.step() + 1) / this.totalSteps()) * 100);

  protected readonly canContinue = computed(() => {
    if (this.busy()) return false;

    if (this.step() === 1) {
      // El formulario se marca al intentar avanzar; aquí solo se comprueba.
      return this.path() === 'affiliate' ? this.affiliateFormValid() : this.organizationFormValid();
    }

    return true;
  });

  protected readonly summary = computed(() =>
    this.path() === 'affiliate'
      ? 'Ya puedes explorar el marketplace con tu compatibilidad calculada en cada campaña.'
      : 'Ya puedes crear tu primera campaña y empezar a recibir solicitudes.',
  );

  protected readonly nextStepHint = computed(() =>
    this.path() === 'affiliate'
      ? 'Filtra el marketplace por «Solo las que califico» para ver dónde encajas hoy.'
      : 'Crea una campaña abierta para validar si la afiliación funciona con tu oferta.',
  );

  protected optionClasses(selected: boolean): string {
    return [
      'focus-ring flex items-start gap-4 rounded-lg border p-5 text-left',
      'transition-[border-color,box-shadow] duration-ui',
      selected
        ? 'border-ink bg-surface shadow-sm'
        : 'border-border bg-surface hover:border-border-strong',
    ].join(' ');
  }

  protected choose(path: Path): void {
    this.path.set(path);
  }

  protected toggleNiche(niche: NicheId): void {
    this.selectedNiches.update((current) =>
      current.includes(niche)
        ? current.filter((item) => item !== niche)
        : current.length >= 5
          ? current
          : [...current, niche],
    );
  }

  protected hasChannel(id: ChannelId): boolean {
    return this.selectedChannels().some((channel) => channel.id === id);
  }

  protected toggleChannel(id: ChannelId): void {
    this.selectedChannels.update((current) =>
      current.some((channel) => channel.id === id)
        ? current.filter((channel) => channel.id !== id)
        : [...current, { id, handle: '', audience: 0 }],
    );
  }

  protected handleFor(id: ChannelId): string {
    return this.selectedChannels().find((channel) => channel.id === id)?.handle ?? '';
  }

  protected audienceFor(id: ChannelId): number {
    return this.selectedChannels().find((channel) => channel.id === id)?.audience ?? 0;
  }

  protected setHandle(id: ChannelId, event: Event): void {
    const handle = (event.target as HTMLInputElement).value;
    this.selectedChannels.update((current) =>
      current.map((channel) => (channel.id === id ? { ...channel, handle } : channel)),
    );
  }

  protected setAudience(id: ChannelId, event: Event): void {
    const audience = Math.max(0, Number((event.target as HTMLInputElement).value) || 0);
    this.selectedChannels.update((current) =>
      current.map((channel) => (channel.id === id ? { ...channel, audience } : channel)),
    );
  }

  /** Muestra el error solo cuando el campo ya se ha tocado o se intentó avanzar. */
  protected errorFor(form: FormGroup, name: string, message: string): string | null {
    const control = form.get(name);
    return control && control.invalid && control.touched ? message : null;
  }

  protected back(): void {
    this.step.update((current) => Math.max(0, current - 1));
  }

  protected skip(): void {
    this.step.set(3);
  }

  protected async next(): Promise<void> {
    if (this.step() === 1 && !this.validateCurrentForm()) return;

    if (this.step() < 3) {
      this.step.update((current) => current + 1);
      return;
    }

    await this.finish();
  }

  private affiliateFormValid(): boolean {
    return this.affiliateForm.valid;
  }

  private organizationFormValid(): boolean {
    return this.organizationForm.valid;
  }

  private validateCurrentForm(): boolean {
    const form = this.path() === 'affiliate' ? this.affiliateForm : this.organizationForm;

    if (form.invalid) {
      form.markAllAsTouched();
      return false;
    }

    return true;
  }

  /**
   * Cierre del onboarding.
   *
   * Guarda el perfil y, si procede, crea la organización; después marca el
   * onboarding como completado y lleva al workspace correspondiente.
   */
  private async finish(): Promise<void> {
    const session = this.session.session();
    if (!session || this.busy()) return;

    this.busy.set(true);

    try {
      await this.saveAffiliateProfile(session.affiliateId);

      let destination = '/app/affiliate/inicio';

      if (this.path() === 'organization') {
        const organization = await this.createOrganization();
        await this.session.patch({
          organizationIds: [...session.organizationIds, organization.id],
          activeWorkspaceId: organization.id,
        });
        destination = `/app/organization/${organization.id}/overview`;
      }

      await this.session.completeOnboarding();
      await this.session.refreshProfile();
      await this.router.navigateByUrl(destination);
    } catch {
      this.toasts.error('No se pudo completar el onboarding');
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * La completitud del perfil se deriva de lo que se ha rellenado, no de un
   * valor arbitrario: es lo que después evalúan los requisitos de las campañas.
   */
  private async saveAffiliateProfile(affiliateId: string): Promise<void> {
    const values = this.affiliateForm.getRawValue();
    const channels = this.selectedChannels().filter((channel) => channel.handle.trim());

    const completeness =
      30 +
      (values.headline ? 15 : 0) +
      (this.selectedNiches().length ? 20 : 0) +
      (channels.length ? 25 : 0) +
      (channels.some((channel) => channel.audience > 0) ? 10 : 0);

    await firstValueFrom(
      this.catalog.updateAffiliate(affiliateId, {
        type: values.type,
        headline: values.headline,
        location: values.location,
        country: 'PE',
        niches: this.selectedNiches(),
        channels: channels.map((channel) => ({
          id: channel.id,
          handle: channel.handle.trim(),
          audience: channel.audience,
        })),
        profileCompleteness: Math.min(100, completeness),
      }),
    );
  }

  private async createOrganization() {
    const values = this.organizationForm.getRawValue();

    return firstValueFrom(
      this.catalog.createOrganization({
        name: values.name,
        kind: values.kind,
        categoryId: values.categoryId as never,
        tagline: values.tagline,
        description: values.description || values.tagline,
        website: values.website,
        location: values.location,
      }),
    );
  }

  protected typeLabel(type: AffiliateType): string {
    return AFFILIATE_TYPE_LABELS[type];
  }

  protected kindLabel(kind: OrganizationKind): string {
    return ORGANIZATION_KIND_LABELS[kind];
  }

  protected nicheLabel(niche: NicheId): string {
    return NICHE_LABELS[niche];
  }
}
