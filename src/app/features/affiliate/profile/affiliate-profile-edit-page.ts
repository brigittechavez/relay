import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { Checkbox, SwitchInput, Switch } from '@ds/choice/choice';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { InputField, TextareaField } from '@ds/input/input';
import { Select, SelectField } from '@ds/select/select';
import { Skeleton } from '@ds/skeleton/skeleton';
import { ToastService } from '@ds/toast/toast.service';
import { SessionStore } from '@core/session/session.store';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { ProfileVisibility } from '@data/models/affiliate';
import {
  AFFILIATE_TYPE_LABELS,
  AffiliateType,
  CHANNELS,
  ChannelId,
  NICHE_LABELS,
  NicheId,
} from '@data/models/taxonomy';
import { RelayScore } from '@domain/relay-score/relay-score';
import { PercentPipe } from '@shared/pipes/format.pipes';

const AFFILIATE_TYPES = Object.keys(AFFILIATE_TYPE_LABELS) as AffiliateType[];
const NICHES = Object.keys(NICHE_LABELS) as NicheId[];

/** Acciones que suben la completitud, ordenadas por lo que más aporta. */
const COMPLETION_RULES = [
  { id: 'headline', label: 'Añade un titular a tu perfil', points: 10 },
  { id: 'bio', label: 'Escribe tu biografía', points: 15 },
  { id: 'niches', label: 'Declara al menos tres nichos', points: 15 },
  { id: 'channels', label: 'Conecta al menos dos canales', points: 20 },
  { id: 'audience', label: 'Indica la audiencia de cada canal', points: 10 },
] as const;

/**
 * Perfil del afiliado.
 *
 * El perfil no es una ficha decorativa: la completitud es un requisito real de
 * varias campañas y los nichos y canales deciden la compatibilidad. Por eso la
 * página muestra el efecto de cada cambio en lugar de limitarse a guardar.
 */
@Component({
  selector: 'rly-affiliate-profile-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    Badge,
    Button,
    Checkbox,
    Switch,
    SwitchInput,
    Field,
    Icon,
    InputField,
    TextareaField,
    Select,
    SelectField,
    Skeleton,
    RelayScore,
    PercentPipe,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      @if (!affiliate()) {
        <rly-skeleton shape="block" height="20rem" />
      } @else if (affiliate(); as person) {
        <header class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 class="text-title-md text-ink">Mi perfil</h2>
            <p class="mt-1 text-ui text-text-secondary">
              Lo que ven las organizaciones cuando revisan tu solicitud.
            </p>
          </div>

          <a rlyButton variant="tertiary" [routerLink]="['/afiliados', person.slug]">
            Ver perfil público
            <rly-icon name="external-link" [size]="14" />
          </a>
        </header>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
          <form class="flex min-w-0 flex-col gap-8" [formGroup]="form" (ngSubmit)="save()">
            <!-- Datos básicos -->
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="basicos"
            >
              <h3 id="basicos" class="text-title-xs text-ink">Datos básicos</h3>

              <div class="mt-4 flex flex-col gap-5">
                <rly-field label="Nombre" required [error]="errorFor('name', 'Escribe tu nombre')">
                  <input rlyInput type="text" formControlName="name" />
                </rly-field>

                <rly-field label="Tipo de afiliado" required>
                  <rly-select>
                    <select rlySelect formControlName="type">
                      @for (type of types; track type) {
                        <option [value]="type">{{ typeLabel(type) }}</option>
                      }
                    </select>
                  </rly-select>
                </rly-field>

                <rly-field
                  label="Titular"
                  hint="Una línea sobre lo que publicas"
                  [error]="errorFor('headline', 'Escribe un titular de al menos 10 caracteres')"
                >
                  <input rlyInput type="text" formControlName="headline" />
                </rly-field>

                <rly-field label="Biografía" hint="Dos o tres frases sobre tu audiencia">
                  <textarea rlyTextarea rows="4" formControlName="bio"></textarea>
                </rly-field>

                <rly-field label="Ciudad y país" required>
                  <input rlyInput type="text" formControlName="location" />
                </rly-field>
              </div>
            </section>

            <!-- Nichos -->
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="nichos"
            >
              <h3 id="nichos" class="text-title-xs text-ink">Nichos</h3>
              <p class="mt-1 text-ui-sm text-text-secondary">
                Es lo que más peso tiene en tu compatibilidad con las campañas.
              </p>

              <div class="mt-4 grid gap-2.5 sm:grid-cols-2">
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
            </section>

            <!-- Canales -->
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="canales"
            >
              <h3 id="canales" class="text-title-xs text-ink">Canales</h3>
              <p class="mt-1 text-ui-sm text-text-secondary">
                Muchas campañas limitan dónde se puede promocionar.
              </p>

              <div class="mt-4 flex flex-col gap-3">
                @for (channel of channels; track channel.id) {
                  <div class="rounded-md border border-border p-4">
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
                            (input)="setAudience(channel.id, $event)"
                          />
                        </label>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>

            <!-- Visibilidad -->
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="visibilidad"
            >
              <h3 id="visibilidad" class="text-title-xs text-ink">Visibilidad pública</h3>
              <p class="mt-1 text-ui-sm text-text-secondary">
                Qué se muestra en tu perfil público. Tus datos financieros no aparecen nunca.
              </p>

              <div class="mt-4 flex flex-col gap-3.5">
                @for (option of visibilityOptions; track option.key) {
                  <label class="flex items-center gap-3 text-ui text-ink">
                    <rly-switch>
                      <input
                        rlySwitch
                        type="checkbox"
                        [checked]="visibility()[option.key]"
                        (change)="toggleVisibility(option.key)"
                      />
                    </rly-switch>
                    {{ option.label }}
                  </label>
                }
              </div>
            </section>

            <div class="flex flex-wrap items-center gap-3 border-t border-border pt-6">
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

          <!-- Columna lateral -->
          <aside class="flex flex-col gap-6">
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="completitud"
            >
              <h3 id="completitud" class="text-title-xs text-ink">Completitud del perfil</h3>

              <div class="mt-4 flex items-baseline justify-between gap-3">
                <p class="text-kpi text-ink">{{ completeness() | rlyPercent: 0 }}</p>
                @if (completeness() >= 90) {
                  <rly-badge tone="success">Perfil completo</rly-badge>
                }
              </div>

              <div class="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  class="h-full rounded-full bg-accent transition-[width] duration-reveal"
                  [style.width.%]="completeness()"
                ></div>
              </div>

              @if (pendingActions().length) {
                <p class="mt-4 text-ui-sm text-text-secondary">Para subirlo:</p>
                <ul class="mt-2 flex flex-col gap-2">
                  @for (action of pendingActions(); track action.id) {
                    <li class="flex items-start gap-2 text-ui-sm text-text-secondary">
                      <rly-icon name="plus" [size]="14" class="mt-0.5 text-text-muted" />
                      <span
                        >{{ action.label }}
                        <span class="text-text-muted">· +{{ action.points }}</span></span
                      >
                    </li>
                  }
                </ul>
              } @else {
                <p class="mt-4 text-ui-sm text-text-secondary">
                  Tu perfil está completo. Algunas campañas Premium lo exigen al 90%.
                </p>
              }
            </section>

            <section class="rounded-lg border border-border bg-surface p-5" aria-labelledby="score">
              <h3 id="score" class="text-title-xs text-ink">Relay Score</h3>
              <rly-relay-score class="mt-4" [affiliate]="person" />
            </section>
          </aside>
        </div>
      }
    </div>
  `,
})
export class AffiliateProfileEditPage {
  private readonly builder = inject(FormBuilder);
  private readonly session = inject(SessionStore);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  protected readonly types = AFFILIATE_TYPES;
  protected readonly niches = NICHES;
  protected readonly channels = CHANNELS;

  protected readonly visibilityOptions: readonly {
    key: keyof ProfileVisibility;
    label: string;
  }[] = [
    { key: 'audience', label: 'Mostrar el tamaño de mi audiencia' },
    { key: 'results', label: 'Mostrar mis resultados destacados' },
    { key: 'channels', label: 'Mostrar mis canales' },
    { key: 'relayScore', label: 'Mostrar mi Relay Score' },
    { key: 'availability', label: 'Mostrar si estoy disponible' },
  ];

  protected readonly affiliate = this.session.affiliate;
  protected readonly busy = signal(false);
  protected readonly saved = signal(false);

  protected readonly selectedNiches = signal<readonly NicheId[]>([]);
  private readonly editedChannels = signal<
    readonly { id: ChannelId; handle: string; audience: number }[]
  >([]);
  protected readonly visibility = signal<ProfileVisibility>({
    audience: true,
    results: true,
    availability: true,
    channels: true,
    relayScore: true,
  });

  protected readonly form: FormGroup = this.builder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['creator' as AffiliateType, Validators.required],
    headline: ['', [Validators.minLength(10)]],
    bio: [''],
    location: ['', Validators.required],
  });

  constructor() {
    // El perfil llega de forma asíncrona: el formulario se rellena cuando está.
    effect(() => {
      const person = this.affiliate();
      if (!person) return;

      this.form.patchValue(
        {
          name: person.name,
          type: person.type,
          headline: person.headline,
          bio: person.bio,
          location: person.location,
        },
        { emitEvent: false },
      );

      this.selectedNiches.set(person.niches);
      this.editedChannels.set(
        person.channels.map((channel) => ({
          id: channel.id,
          handle: channel.handle,
          audience: channel.audience,
        })),
      );
      this.visibility.set(person.visibility);
    });
  }

  /**
   * Completitud calculada, no almacenada: cambia en vivo mientras se edita, que
   * es lo que convierte la barra en algo accionable.
   */
  protected readonly completeness = computed(() => {
    const values = this.form.getRawValue();
    const channels = this.editedChannels().filter((channel) => channel.handle.trim());

    let score = 30;
    if (values.headline?.trim()) score += 10;
    if (values.bio?.trim()) score += 15;
    if (this.selectedNiches().length >= 3) score += 15;
    if (channels.length >= 2) score += 20;
    if (channels.length && channels.every((channel) => channel.audience > 0)) score += 10;

    return Math.min(100, score);
  });

  protected readonly pendingActions = computed(() => {
    const values = this.form.getRawValue();
    const channels = this.editedChannels().filter((channel) => channel.handle.trim());

    return COMPLETION_RULES.filter((rule) => {
      switch (rule.id) {
        case 'headline':
          return !values.headline?.trim();
        case 'bio':
          return !values.bio?.trim();
        case 'niches':
          return this.selectedNiches().length < 3;
        case 'channels':
          return channels.length < 2;
        case 'audience':
          return !channels.length || channels.some((channel) => channel.audience === 0);
      }
    });
  });

  protected errorFor(name: string, message: string): string | null {
    const control = this.form.get(name);
    return control && control.invalid && control.touched ? message : null;
  }

  protected toggleNiche(niche: NicheId): void {
    this.selectedNiches.update((current) =>
      current.includes(niche) ? current.filter((item) => item !== niche) : [...current, niche],
    );
    this.saved.set(false);
  }

  protected hasChannel(id: ChannelId): boolean {
    return this.editedChannels().some((channel) => channel.id === id);
  }

  protected toggleChannel(id: ChannelId): void {
    this.editedChannels.update((current) =>
      current.some((channel) => channel.id === id)
        ? current.filter((channel) => channel.id !== id)
        : [...current, { id, handle: '', audience: 0 }],
    );
    this.saved.set(false);
  }

  protected handleFor(id: ChannelId): string {
    return this.editedChannels().find((channel) => channel.id === id)?.handle ?? '';
  }

  protected audienceFor(id: ChannelId): number {
    return this.editedChannels().find((channel) => channel.id === id)?.audience ?? 0;
  }

  protected setHandle(id: ChannelId, event: Event): void {
    const handle = (event.target as HTMLInputElement).value;
    this.editedChannels.update((current) =>
      current.map((channel) => (channel.id === id ? { ...channel, handle } : channel)),
    );
    this.saved.set(false);
  }

  protected setAudience(id: ChannelId, event: Event): void {
    const audience = Math.max(0, Number((event.target as HTMLInputElement).value) || 0);
    this.editedChannels.update((current) =>
      current.map((channel) => (channel.id === id ? { ...channel, audience } : channel)),
    );
    this.saved.set(false);
  }

  protected toggleVisibility(key: keyof ProfileVisibility): void {
    this.visibility.update((current) => ({ ...current, [key]: !current[key] }));
    this.saved.set(false);
  }

  protected async save(): Promise<void> {
    const person = this.affiliate();
    if (!person || this.busy()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);

    try {
      const values = this.form.getRawValue();

      await firstValueFrom(
        this.catalog.updateAffiliate(person.id, {
          name: values.name,
          type: values.type,
          headline: values.headline,
          bio: values.bio,
          location: values.location,
          niches: this.selectedNiches(),
          channels: this.editedChannels()
            .filter((channel) => channel.handle.trim())
            .map((channel) => ({
              id: channel.id,
              handle: channel.handle.trim(),
              audience: channel.audience,
            })),
          visibility: this.visibility(),
          profileCompleteness: this.completeness(),
        }),
      );

      await this.session.refreshProfile();
      this.saved.set(true);
      this.toasts.success('Perfil actualizado');
    } catch {
      this.toasts.error('No se pudieron guardar los cambios');
    } finally {
      this.busy.set(false);
    }
  }

  protected typeLabel(type: AffiliateType): string {
    return AFFILIATE_TYPE_LABELS[type];
  }

  protected nicheLabel(niche: NicheId): string {
    return NICHE_LABELS[niche];
  }
}
