import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Button } from '@ds/button/button';
import { Checkbox } from '@ds/choice/choice';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { InputField, TextareaField } from '@ds/input/input';
import { Select, SelectField } from '@ds/select/select';
import { ToastService } from '@ds/toast/toast.service';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import {
  ATTRIBUTION_LABELS,
  AttributionWindow,
  Campaign,
  CampaignRequirement,
  CampaignAccess,
  CommissionModel,
  CONVERSION_EVENT_LABELS,
  ConversionEvent,
  PriceUnit,
} from '@data/models/campaign';
import {
  AFFILIATE_LEVEL_LABELS,
  AffiliateLevel,
  CATEGORIES,
  CategoryId,
  CHANNELS,
  ChannelId,
  NICHE_LABELS,
  NicheId,
} from '@data/models/taxonomy';
import { estimateEarnings } from '@data/logic/commission';
import { MoneyPipe } from '@shared/pipes/format.pipes';

const STEPS = [
  { id: 'campaign', label: 'Campaña' },
  { id: 'commission', label: 'Comisión' },
  { id: 'affiliates', label: 'Afiliados' },
  { id: 'publish', label: 'Recursos y publicar' },
] as const;

const COMMISSION_MODELS: readonly { id: CommissionModel; label: string; hint: string }[] = [
  { id: 'fixed', label: 'Monto fijo', hint: 'Un importe por cada conversión' },
  { id: 'percentage', label: 'Porcentaje', hint: 'Un porcentaje del valor de la venta' },
  { id: 'recurring', label: 'Recurrente', hint: 'Un porcentaje durante varios meses' },
  { id: 'per-lead', label: 'Por lead', hint: 'Un importe por contacto cualificado' },
];

const ACCESS_OPTIONS: readonly { id: CampaignAccess; label: string; hint: string }[] = [
  {
    id: 'open',
    label: 'Abierta',
    hint: 'Cualquiera que cumpla los mínimos se une al instante. Para captar volumen.',
  },
  {
    id: 'selective',
    label: 'Selectiva',
    hint: 'Revisas cada solicitud con el perfil y la propuesta delante.',
  },
  {
    id: 'premium',
    label: 'Premium',
    hint: 'Requisitos más altos y propuesta obligatoria. Para perfiles concretos.',
  },
];

const LEVELS = Object.keys(AFFILIATE_LEVEL_LABELS) as AffiliateLevel[];
const NICHES = Object.keys(NICHE_LABELS) as NicheId[];

/**
 * Wizard de creación de campaña.
 *
 * Cuatro pasos y divulgación progresiva: los campos de comisión recurrente solo
 * aparecen si el modelo es recurrente, la pregunta de estrategia solo si la
 * campaña es selectiva o premium, y los requisitos de nivel y score solo si la
 * modalidad los usa. Mostrarlo todo a la vez convertiría un formulario de doce
 * campos en uno de treinta.
 *
 * El paso 4 muestra el resumen completo antes de publicar: es la última
 * oportunidad de revisar unas condiciones que después ven todos los afiliados.
 */
@Component({
  selector: 'rly-campaign-wizard-page',
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
    Select,
    SelectField,
    MoneyPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <div class="mx-auto max-w-3xl">
        <nav aria-label="Ruta" class="flex flex-wrap items-center gap-1.5 text-ui-sm">
          <a
            [routerLink]="['/app/organization', organizationId(), 'campanas']"
            class="focus-ring rounded-xs text-text-secondary hover:text-ink"
          >
            Campañas
          </a>
          <span class="text-text-muted" aria-hidden="true">/</span>
          <span class="text-text-secondary">Nueva campaña</span>
        </nav>

        <h2 class="mt-3 text-title-md text-ink">Crear campaña</h2>

        <!-- Pasos -->
        <ol class="mt-6 flex flex-wrap gap-x-6 gap-y-2" aria-label="Pasos">
          @for (item of steps; track item.id; let index = $index) {
            <li class="flex items-center gap-2">
              <span [class]="stepMarkClasses(index)" aria-hidden="true">
                @if (index < step()) {
                  <rly-icon name="check" [size]="12" [strokeWidth]="2.5" />
                } @else {
                  {{ index + 1 }}
                }
              </span>
              <span
                class="text-ui-sm"
                [class.font-medium]="index === step()"
                [class.text-ink]="index <= step()"
                [class.text-text-muted]="index > step()"
                [attr.aria-current]="index === step() ? 'step' : null"
              >
                {{ item.label }}
              </span>
            </li>
          }
        </ol>

        <div class="mt-8">
          @switch (step()) {
            <!-- 1 · Campaña -->
            @case (0) {
              <form [formGroup]="campaignForm" class="flex flex-col gap-6">
                <rly-field
                  label="Nombre de la campaña"
                  hint="Es lo primero que se ve en el marketplace"
                  required
                  [error]="
                    errorFor(campaignForm, 'name', 'Escribe un nombre de al menos 3 caracteres')
                  "
                >
                  <input rlyInput type="text" formControlName="name" placeholder="Landing Pro" />
                </rly-field>

                <rly-field
                  label="Resumen"
                  hint="Una línea. Aparece en las tarjetas y en los resultados de búsqueda."
                  required
                  [error]="
                    errorFor(
                      campaignForm,
                      'summary',
                      'Escribe un resumen de al menos 20 caracteres'
                    )
                  "
                >
                  <input
                    rlyInput
                    type="text"
                    formControlName="summary"
                    placeholder="Landing page profesional entregada en tres semanas"
                  />
                </rly-field>

                <rly-field
                  label="Descripción"
                  hint="Qué incluye, para quién es y qué la diferencia"
                  required
                  [error]="
                    errorFor(
                      campaignForm,
                      'description',
                      'Escribe una descripción de al menos 60 caracteres'
                    )
                  "
                >
                  <textarea rlyTextarea rows="5" formControlName="description"></textarea>
                </rly-field>

                <div class="grid gap-6 sm:grid-cols-2">
                  <rly-field label="Categoría" required>
                    <rly-select>
                      <select rlySelect formControlName="categoryId" (change)="onCategoryChange()">
                        @for (category of categories; track category.id) {
                          <option [value]="category.id">{{ category.label }}</option>
                        }
                      </select>
                    </rly-select>
                  </rly-field>

                  <rly-field label="Subcategoría" required>
                    <rly-select>
                      <select rlySelect formControlName="subcategoryId">
                        @for (subcategory of subcategories(); track subcategory.id) {
                          <option [value]="subcategory.id">{{ subcategory.label }}</option>
                        }
                      </select>
                    </rly-select>
                  </rly-field>
                </div>

                <div class="grid gap-6 sm:grid-cols-2">
                  <rly-field
                    label="Precio de la oferta"
                    hint="En soles. Es la base del cálculo de comisión."
                    required
                    [error]="errorFor(campaignForm, 'price', 'Introduce un precio mayor que cero')"
                  >
                    <input rlyInput type="number" min="1" formControlName="price" />
                  </rly-field>

                  <rly-field label="Tipo de cobro" required>
                    <rly-select>
                      <select rlySelect formControlName="priceUnit">
                        <option value="one-time">Pago único</option>
                        <option value="month">Suscripción mensual</option>
                        <option value="year">Suscripción anual</option>
                      </select>
                    </rly-select>
                  </rly-field>
                </div>

                <rly-field
                  label="URL de destino"
                  hint="A dónde llevan los links de los afiliados"
                  required
                  [error]="
                    errorFor(
                      campaignForm,
                      'landingUrl',
                      'Introduce una URL que empiece por https://'
                    )
                  "
                >
                  <input
                    rlyInput
                    type="url"
                    formControlName="landingUrl"
                    placeholder="https://tuempresa.pe/oferta"
                  />
                </rly-field>

                <div class="rounded-md border border-dashed border-border bg-canvas p-4">
                  <p class="flex items-center gap-2 text-ui-sm text-text-secondary">
                    <rly-icon name="image" [size]="16" />
                    La portada se genera automáticamente a partir de la categoría. Podrás
                    sustituirla por una imagen propia más adelante.
                  </p>
                </div>
              </form>
            }

            <!-- 2 · Comisión -->
            @case (1) {
              <form [formGroup]="commissionForm" class="flex flex-col gap-6">
                <fieldset>
                  <legend class="text-ui-sm font-medium text-ink">
                    ¿Qué conversión genera comisión?
                  </legend>
                  <p class="mt-1 text-ui-sm text-text-secondary">
                    Es el evento que tú confirmas. Nada se paga antes de que lo valides.
                  </p>

                  <rly-select class="mt-3">
                    <select
                      rlySelect
                      formControlName="conversionEvent"
                      aria-label="Evento de conversión"
                    >
                      @for (event of conversionEvents; track event) {
                        <option [value]="event">{{ eventLabel(event) }}</option>
                      }
                    </select>
                  </rly-select>
                </fieldset>

                <fieldset>
                  <legend class="text-ui-sm font-medium text-ink">Modelo de comisión</legend>

                  <div class="mt-3 grid gap-2 sm:grid-cols-2">
                    @for (model of commissionModels; track model.id) {
                      <label [class]="optionClasses(commissionForm.value.model === model.id)">
                        <input
                          type="radio"
                          class="sr-only"
                          formControlName="model"
                          [value]="model.id"
                        />
                        <span class="block text-ui font-medium text-ink">{{ model.label }}</span>
                        <span class="mt-0.5 block text-ui-sm text-text-secondary">
                          {{ model.hint }}
                        </span>
                      </label>
                    }
                  </div>
                </fieldset>

                <!-- Divulgación progresiva: solo el campo que el modelo usa -->
                @if (usesAmount()) {
                  <rly-field
                    label="Importe por conversión"
                    hint="En soles"
                    required
                    [error]="
                      errorFor(commissionForm, 'amount', 'Introduce un importe mayor que cero')
                    "
                  >
                    <input rlyInput type="number" min="1" formControlName="amount" />
                  </rly-field>
                } @else {
                  <div class="grid gap-6 sm:grid-cols-2">
                    <rly-field
                      label="Porcentaje"
                      hint="Sobre el valor de la conversión"
                      required
                      [error]="
                        errorFor(
                          commissionForm,
                          'percentage',
                          'Introduce un porcentaje entre 1 y 100'
                        )
                      "
                    >
                      <input
                        rlyInput
                        type="number"
                        min="1"
                        max="100"
                        formControlName="percentage"
                      />
                    </rly-field>

                    @if (commissionForm.value.model === 'recurring') {
                      <rly-field label="Meses que se paga" required>
                        <rly-select>
                          <select rlySelect formControlName="recurringMonths">
                            @for (months of [1, 3, 6, 12]; track months) {
                              <option [value]="months">{{ months }} meses</option>
                            }
                          </select>
                        </rly-select>
                      </rly-field>
                    }
                  </div>
                }

                <rly-field
                  label="Ventana de atribución"
                  hint="Tiempo desde el clic hasta la conversión para que cuente"
                  required
                >
                  <rly-select>
                    <select rlySelect formControlName="attributionWindow">
                      @for (window of attributionWindows; track window) {
                        <option [value]="window">{{ attributionLabel(window) }}</option>
                      }
                    </select>
                  </rly-select>
                </rly-field>

                <!-- Bono opcional -->
                <div class="rounded-lg border border-border bg-surface p-5">
                  <label class="flex items-center gap-3 text-ui text-ink">
                    <input rlyCheckbox type="checkbox" formControlName="hasBonus" />
                    Añadir un bono por meta
                  </label>

                  @if (commissionForm.value.hasBonus) {
                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                      <rly-field label="A partir de" hint="Conversiones aprobadas">
                        <input rlyInput type="number" min="1" formControlName="bonusThreshold" />
                      </rly-field>
                      <rly-field label="Importe del bono" hint="En soles">
                        <input rlyInput type="number" min="1" formControlName="bonusAmount" />
                      </rly-field>
                    </div>
                  }
                </div>

                <!-- Vista previa del cálculo -->
                <div class="rounded-lg border border-accent/50 bg-accent-soft p-5">
                  <p class="text-ui font-medium text-ink">Lo que verá un afiliado</p>
                  <dl class="mt-3 flex flex-col gap-2">
                    <div class="flex items-baseline justify-between gap-3">
                      <dt class="text-ui-sm text-text-secondary">Por conversión</dt>
                      <dd class="text-ui tabular-nums text-ink">
                        {{ previewPerConversion() | rlyMoney }}
                      </dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-3">
                      <dt class="text-ui-sm text-text-secondary">Con 5 conversiones al mes</dt>
                      <dd class="text-ui font-medium tabular-nums text-ink">
                        {{ previewMonthly() | rlyMoney }}
                      </dd>
                    </div>
                  </dl>
                </div>
              </form>
            }

            <!-- 3 · Afiliados -->
            @case (2) {
              <form [formGroup]="accessForm" class="flex flex-col gap-6">
                <fieldset>
                  <legend class="text-ui-sm font-medium text-ink">Modalidad de acceso</legend>

                  <div class="mt-3 flex flex-col gap-2">
                    @for (option of accessOptions; track option.id) {
                      <label [class]="optionClasses(accessForm.value.access === option.id)">
                        <input
                          type="radio"
                          class="sr-only"
                          formControlName="access"
                          [value]="option.id"
                        />
                        <span class="block text-ui font-medium text-ink">{{ option.label }}</span>
                        <span class="mt-0.5 block text-ui-sm text-text-secondary">
                          {{ option.hint }}
                        </span>
                      </label>
                    }
                  </div>
                </fieldset>

                <!-- Los requisitos de nivel y score solo aplican fuera de las abiertas -->
                @if (accessForm.value.access !== 'open') {
                  <div class="grid gap-6 sm:grid-cols-2">
                    <rly-field label="Nivel mínimo">
                      <rly-select>
                        <select rlySelect formControlName="minLevel">
                          @for (level of levels; track level) {
                            <option [value]="level">{{ levelLabel(level) }}</option>
                          }
                        </select>
                      </rly-select>
                    </rly-field>

                    <rly-field label="Relay Score mínimo" hint="Entre 0 y 100">
                      <input rlyInput type="number" min="0" max="100" formControlName="minScore" />
                    </rly-field>
                  </div>
                }

                <rly-field label="Perfil completo mínimo" hint="Porcentaje de completitud exigido">
                  <input rlyInput type="number" min="0" max="100" formControlName="minProfile" />
                </rly-field>

                <fieldset>
                  <legend class="text-ui-sm font-medium text-ink">Nichos afines</legend>
                  <p class="mt-1 text-ui-sm text-text-secondary">
                    No bloquean la solicitud, pero determinan la compatibilidad que se muestra.
                  </p>

                  <div class="mt-3 grid gap-2.5 sm:grid-cols-2">
                    @for (niche of niches; track niche) {
                      <label class="flex items-center gap-2.5 text-ui text-text-secondary">
                        <input
                          rlyCheckbox
                          type="checkbox"
                          [checked]="selectedNiches().includes(niche)"
                          (change)="toggleNiche(niche)"
                        />
                        {{ nicheLabel(niche) }}
                      </label>
                    }
                  </div>
                </fieldset>

                <fieldset>
                  <legend class="text-ui-sm font-medium text-ink">Canales permitidos</legend>

                  <div class="mt-3 grid gap-2.5 sm:grid-cols-2">
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

                  @if (!selectedChannels().length) {
                    <p class="mt-3 text-ui-sm text-warning-strong">
                      Elige al menos un canal: sin canales nadie podrá promocionar la campaña.
                    </p>
                  }
                </fieldset>

                <!-- La pregunta solo tiene sentido si alguien va a leerla -->
                @if (accessForm.value.access !== 'open') {
                  <rly-field
                    label="Pregunta para quien solicite"
                    hint="Se responde al aplicar y la lees antes de decidir"
                    [required]="accessForm.value.access === 'premium'"
                    [error]="strategyQuestionError()"
                  >
                    <input
                      rlyInput
                      type="text"
                      formControlName="strategyQuestion"
                      placeholder="¿Cómo presentarías este servicio a tu audiencia?"
                    />
                  </rly-field>
                }
              </form>
            }

            <!-- 4 · Recursos y publicar -->
            @case (3) {
              <form [formGroup]="publishForm" class="flex flex-col gap-6">
                <rly-field
                  label="Texto sugerido para afiliados"
                  hint="Lo podrán copiar desde el espacio de la campaña"
                >
                  <textarea rlyTextarea rows="4" formControlName="copy"></textarea>
                </rly-field>

                <label class="flex items-center gap-3 text-ui text-ink">
                  <input rlyCheckbox type="checkbox" formControlName="promoCodeEnabled" />
                  Generar un código promocional por afiliado
                </label>

                <rly-field label="Meta principal" hint="Una sola meta por campaña">
                  <input
                    rlyInput
                    type="text"
                    formControlName="goalLabel"
                    placeholder="5 conversiones aprobadas este mes"
                  />
                </rly-field>

                <rly-field label="Objetivo numérico" hint="Conversiones a alcanzar">
                  <input rlyInput type="number" min="1" formControlName="goalTarget" />
                </rly-field>

                <!-- Resumen -->
                <section
                  class="rounded-lg border border-border bg-surface p-5"
                  aria-labelledby="resumen"
                >
                  <h3 id="resumen" class="text-title-xs text-ink">Resumen de la campaña</h3>

                  <dl class="mt-4 flex flex-col divide-y divide-border">
                    @for (row of summary(); track row.label) {
                      <div class="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                        <dt class="text-ui-sm text-text-secondary">{{ row.label }}</dt>
                        <dd class="text-ui text-ink">{{ row.value }}</dd>
                      </div>
                    }
                  </dl>
                </section>

                <div class="rounded-md border border-border bg-canvas p-4">
                  <p class="flex items-start gap-2 text-ui-sm text-text-secondary">
                    <rly-icon name="info" [size]="16" class="mt-0.5 text-info" />
                    Al publicar, la campaña aparece en el marketplace y empieza a recibir
                    solicitudes. Podrás pausarla o editarla desde su configuración.
                  </p>
                </div>
              </form>
            }
          }
        </div>

        <!-- Navegación -->
        <div
          class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6"
        >
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

          <div class="flex flex-wrap items-center gap-2">
            @if (step() === steps.length - 1) {
              <button
                rlyButton
                variant="tertiary"
                type="button"
                [loading]="savingDraft()"
                (click)="publish('draft')"
              >
                Guardar borrador
              </button>
              <button
                rlyButton
                variant="primary"
                type="button"
                [loading]="busy()"
                (click)="publish('active')"
              >
                Publicar campaña
              </button>
            } @else {
              <button rlyButton variant="primary" type="button" (click)="next()">
                Continuar
                <rly-icon name="arrow-right" [size]="16" />
              </button>
            }
          </div>
        </div>

        @if (blocked()) {
          <p
            class="mt-4 flex items-start gap-2 rounded-md border border-danger/40 bg-danger-soft
                   px-4 py-3 text-ui-sm text-danger-strong"
            role="alert"
          >
            <rly-icon name="alert" [size]="16" class="mt-0.5" />
            <span>{{ blocked() }}</span>
          </p>
        }
      </div>
    </div>
  `,
})
export class CampaignWizardPage {
  private readonly builder = inject(FormBuilder);
  private readonly catalog = inject(CatalogRepository);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  readonly organizationId = input.required<string>();

  protected readonly steps = STEPS;
  protected readonly categories = CATEGORIES;
  protected readonly channels = CHANNELS;
  protected readonly niches = NICHES;
  protected readonly levels = LEVELS;
  protected readonly commissionModels = COMMISSION_MODELS;
  protected readonly accessOptions = ACCESS_OPTIONS;

  protected readonly conversionEvents = Object.keys(CONVERSION_EVENT_LABELS) as ConversionEvent[];
  protected readonly attributionWindows = Object.keys(ATTRIBUTION_LABELS) as AttributionWindow[];

  protected readonly step = signal(0);
  protected readonly busy = signal(false);
  protected readonly savingDraft = signal(false);
  protected readonly blocked = signal<string | null>(null);

  protected readonly selectedNiches = signal<readonly NicheId[]>(['marketing', 'negocios']);
  protected readonly selectedChannels = signal<readonly ChannelId[]>([
    'instagram',
    'youtube',
    'newsletter',
  ]);

  protected readonly campaignForm: FormGroup = this.builder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    summary: ['', [Validators.required, Validators.minLength(20)]],
    description: ['', [Validators.required, Validators.minLength(60)]],
    categoryId: ['servicios' as CategoryId, Validators.required],
    subcategoryId: ['desarrollo-web', Validators.required],
    price: [1000, [Validators.required, Validators.min(1)]],
    priceUnit: ['one-time' as PriceUnit, Validators.required],
    landingUrl: ['', [Validators.required, Validators.pattern(/^https:\/\/.+/)]],
  });

  protected readonly commissionForm: FormGroup = this.builder.nonNullable.group({
    conversionEvent: ['sale' as ConversionEvent, Validators.required],
    model: ['fixed' as CommissionModel, Validators.required],
    amount: [200, [Validators.min(1)]],
    percentage: [15, [Validators.min(1), Validators.max(100)]],
    recurringMonths: [3],
    attributionWindow: ['30d' as AttributionWindow, Validators.required],
    hasBonus: [false],
    bonusThreshold: [5],
    bonusAmount: [500],
  });

  protected readonly accessForm: FormGroup = this.builder.nonNullable.group({
    access: ['selective' as CampaignAccess, Validators.required],
    minLevel: ['rising' as AffiliateLevel],
    minScore: [65],
    minProfile: [70],
    strategyQuestion: ['¿Cómo presentarías este servicio a tu audiencia?'],
  });

  protected readonly publishForm: FormGroup = this.builder.nonNullable.group({
    copy: [''],
    promoCodeEnabled: [true],
    goalLabel: ['5 conversiones aprobadas este mes'],
    goalTarget: [5, [Validators.min(1)]],
  });

  protected readonly subcategories = computed(() => {
    const categoryId = this.campaignForm.value.categoryId as CategoryId;
    return CATEGORIES.find((category) => category.id === categoryId)?.subcategories ?? [];
  });

  protected readonly usesAmount = computed(() => {
    const model = this.commissionForm.value.model as CommissionModel;
    return model === 'fixed' || model === 'per-lead' || model === 'tiered';
  });

  /** Vista previa con las mismas funciones que usa el marketplace. */
  private readonly draftCampaign = computed<Campaign>(() => this.buildCampaign('active'));

  protected readonly previewPerConversion = computed(
    () => estimateEarnings(this.draftCampaign(), 1).base,
  );

  protected readonly previewMonthly = computed(
    () => estimateEarnings(this.draftCampaign(), 5).total,
  );

  protected readonly strategyQuestionError = computed(() => {
    const access = this.accessForm.value.access as CampaignAccess;
    const question = (this.accessForm.value.strategyQuestion as string) ?? '';

    return access === 'premium' && question.trim().length < 10
      ? 'Las campañas premium necesitan una pregunta para poder revisar las solicitudes'
      : null;
  });

  protected readonly summary = computed(() => {
    const campaign = this.draftCampaign();
    const money = new MoneyPipe();

    return [
      { label: 'Nombre', value: campaign.name || '—' },
      { label: 'Categoría', value: this.categoryLabel(campaign.categoryId) },
      { label: 'Precio', value: money.transform(campaign.price) },
      { label: 'Comisión por conversión', value: money.transform(this.previewPerConversion()) },
      {
        label: 'Conversión que paga',
        value: CONVERSION_EVENT_LABELS[campaign.commission.conversionEvent],
      },
      { label: 'Atribución', value: ATTRIBUTION_LABELS[campaign.commission.attributionWindow] },
      {
        label: 'Acceso',
        value: ACCESS_OPTIONS.find((option) => option.id === campaign.access)?.label ?? '',
      },
      { label: 'Canales', value: `${campaign.channels.length} seleccionados` },
      { label: 'Código promocional', value: campaign.promoCodeEnabled ? 'Sí' : 'No' },
    ];
  });

  protected stepMarkClasses(index: number): string {
    const base =
      'grid size-6 shrink-0 place-items-center rounded-full text-ui-sm font-medium tabular-nums';

    if (index < this.step()) return `${base} bg-ink text-accent`;
    if (index === this.step()) return `${base} bg-accent text-accent-contrast`;
    return `${base} border border-border bg-surface text-text-muted`;
  }

  protected optionClasses(selected: boolean): string {
    return [
      'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
      'focus-within:outline-ink cursor-pointer rounded-md border p-4',
      'transition-[border-color,background-color] duration-micro',
      selected ? 'border-ink bg-surface' : 'border-border bg-surface hover:border-border-strong',
    ].join(' ');
  }

  protected errorFor(form: FormGroup, name: string, message: string): string | null {
    const control = form.get(name);
    return control && control.invalid && control.touched ? message : null;
  }

  protected onCategoryChange(): void {
    // Al cambiar de categoría la subcategoría anterior deja de existir.
    this.campaignForm.patchValue({ subcategoryId: this.subcategories()[0]?.id ?? '' });
  }

  protected toggleNiche(niche: NicheId): void {
    this.selectedNiches.update((current) =>
      current.includes(niche) ? current.filter((item) => item !== niche) : [...current, niche],
    );
  }

  protected toggleChannel(channel: ChannelId): void {
    this.selectedChannels.update((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
  }

  protected back(): void {
    this.blocked.set(null);
    this.step.update((current) => Math.max(0, current - 1));
  }

  protected next(): void {
    if (!this.validateStep()) return;

    this.blocked.set(null);
    this.step.update((current) => Math.min(this.steps.length - 1, current + 1));
  }

  private validateStep(): boolean {
    const form = [this.campaignForm, this.commissionForm, this.accessForm, this.publishForm][
      this.step()
    ];

    if (form.invalid) {
      form.markAllAsTouched();
      this.blocked.set('Revisa los campos marcados antes de continuar.');
      return false;
    }

    if (this.step() === 2) {
      if (!this.selectedChannels().length) {
        this.blocked.set('Elige al menos un canal permitido.');
        return false;
      }

      if (this.strategyQuestionError()) {
        this.blocked.set(this.strategyQuestionError());
        return false;
      }
    }

    return true;
  }

  protected async publish(status: 'draft' | 'active'): Promise<void> {
    if (this.busy() || this.savingDraft()) return;

    if (status === 'active' && !this.validateAll()) return;

    const flag = status === 'draft' ? this.savingDraft : this.busy;
    flag.set(true);

    try {
      const campaign = await firstValueFrom(
        this.catalog.createCampaign(this.buildCampaign(status)),
      );

      this.toasts.success(
        status === 'draft' ? 'Borrador guardado' : `${campaign.name} está publicada`,
      );

      await this.router.navigate([
        '/app/organization',
        this.organizationId(),
        'campanas',
        campaign.id,
        'resumen',
      ]);
    } catch {
      this.toasts.error('No se pudo crear la campaña');
    } finally {
      flag.set(false);
    }
  }

  private validateAll(): boolean {
    const forms = [this.campaignForm, this.commissionForm, this.accessForm, this.publishForm];
    const invalidIndex = forms.findIndex((form) => form.invalid);

    if (invalidIndex !== -1) {
      forms[invalidIndex].markAllAsTouched();
      this.step.set(invalidIndex);
      this.blocked.set('Faltan datos en este paso para poder publicar.');
      return false;
    }

    if (!this.selectedChannels().length) {
      this.step.set(2);
      this.blocked.set('Elige al menos un canal permitido.');
      return false;
    }

    return true;
  }

  /**
   * Compone la campaña a partir de los cuatro formularios.
   *
   * Los requisitos se derivan de las decisiones del paso 3 en lugar de pedirse
   * uno a uno: es lo que evita que el wizard se convierta en un formulario de
   * treinta campos.
   */
  private buildCampaign(status: 'draft' | 'active'): Campaign {
    const campaign = this.campaignForm.getRawValue();
    const commission = this.commissionForm.getRawValue();
    const access = this.accessForm.getRawValue();
    const publish = this.publishForm.getRawValue();

    return {
      id: '',
      slug: '',
      name: campaign.name,
      organizationId: this.organizationId(),
      categoryId: campaign.categoryId,
      subcategoryId: campaign.subcategoryId,
      tags: access.access === 'open' ? ['aceptacion-inmediata', 'nuevo'] : ['nuevo'],
      summary: campaign.summary,
      description: campaign.description,
      offer: campaign.summary,
      price: Number(campaign.price),
      priceUnit: campaign.priceUnit,
      commission: {
        model: commission.model,
        amount: this.usesAmount() ? Number(commission.amount) : undefined,
        percentage: this.usesAmount() ? undefined : Number(commission.percentage),
        recurringMonths:
          commission.model === 'recurring' ? Number(commission.recurringMonths) : undefined,
        bonus: commission.hasBonus
          ? { threshold: Number(commission.bonusThreshold), amount: Number(commission.bonusAmount) }
          : undefined,
        conversionEvent: commission.conversionEvent,
        attributionWindow: commission.attributionWindow,
      },
      access: access.access,
      status,
      duration: { type: 'evergreen' },
      requirements: this.buildRequirements(),
      channels: this.selectedChannels(),
      niches: this.selectedNiches(),
      countries: ['PE'],
      audience: '',
      audienceTarget: 30000,
      restrictions: [],
      benefits: [],
      landingUrl: campaign.landingUrl,
      resources: publish.copy
        ? [
            {
              id: 'copy-1',
              kind: 'copy' as const,
              title: 'Texto sugerido',
              description: 'Propuesto por la organización.',
              body: publish.copy,
            },
          ]
        : [],
      promoCodeEnabled: publish.promoCodeEnabled,
      strategyQuestion: access.access === 'open' ? undefined : access.strategyQuestion || undefined,
      goal: {
        label: publish.goalLabel,
        target: Number(publish.goalTarget),
        unit: 'conversions' as const,
      },
      metrics: { activeAffiliates: 0, conversionRate: 0, conversions: 0, clicks: 0 },
      cover: `${campaign.categoryId}-01`,
      createdAt: '',
    };
  }

  private buildRequirements(): CampaignRequirement[] {
    const access = this.accessForm.getRawValue();
    const requirements: CampaignRequirement[] = [
      {
        id: 'profile',
        kind: 'profile',
        label: `Perfil completo al ${access.minProfile}%`,
        mandatory: true,
        profileCompleteness: Number(access.minProfile),
      },
      {
        id: 'country',
        kind: 'country',
        label: 'Ubicación en Perú',
        mandatory: true,
        countries: ['PE'],
      },
    ];

    if (access.access !== 'open') {
      requirements.push(
        {
          id: 'level',
          kind: 'level',
          label: `Nivel ${AFFILIATE_LEVEL_LABELS[access.minLevel as AffiliateLevel]} o superior`,
          mandatory: true,
          level: access.minLevel,
        },
        {
          id: 'score',
          kind: 'score',
          label: `Relay Score de ${access.minScore} o más`,
          mandatory: access.access === 'premium',
          score: Number(access.minScore),
        },
      );
    }

    if (this.selectedNiches().length) {
      requirements.push({
        id: 'niche',
        kind: 'niche',
        label: 'Nicho afín a la campaña',
        mandatory: false,
        niches: this.selectedNiches(),
      });
    }

    return requirements;
  }

  protected eventLabel(event: ConversionEvent): string {
    return CONVERSION_EVENT_LABELS[event];
  }

  protected attributionLabel(window: AttributionWindow): string {
    return ATTRIBUTION_LABELS[window];
  }

  protected levelLabel(level: AffiliateLevel): string {
    return AFFILIATE_LEVEL_LABELS[level];
  }

  protected nicheLabel(niche: NicheId): string {
    return NICHE_LABELS[niche];
  }

  protected categoryLabel(id: CategoryId): string {
    return CATEGORIES.find((category) => category.id === id)?.label ?? id;
  }
}
