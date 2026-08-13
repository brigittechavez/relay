import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Badge } from '@ds/badge/badge';
import { Button } from '@ds/button/button';
import { Field } from '@ds/field/field';
import { Icon } from '@ds/icon/icon';
import { InputField, TextareaField } from '@ds/input/input';
import { Select, SelectField } from '@ds/select/select';
import { Skeleton } from '@ds/skeleton/skeleton';
import { ToastService } from '@ds/toast/toast.service';
import { DemoControls } from '@core/session/demo-controls';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import {
  ORGANIZATION_KIND_LABELS,
  OrganizationKind,
  PLAN_LABELS,
  TRUST_SIGNAL_LABELS,
} from '@data/models/organization';
import { CATEGORIES } from '@data/models/taxonomy';

const KINDS = Object.keys(ORGANIZATION_KIND_LABELS) as OrganizationKind[];

/**
 * Configuración de la organización.
 *
 * Edita lo que se ve en el perfil público. Las señales de confianza y el plan
 * no son editables: se ganan operando y se contratan, y dejar que se cambien
 * desde aquí vaciaría de sentido las que muestran las demás organizaciones.
 */
@Component({
  selector: 'rly-organization-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    Badge,
    Button,
    Field,
    Icon,
    InputField,
    TextareaField,
    Select,
    SelectField,
    Skeleton,
    DemoControls,
  ],
  host: { class: 'block' },
  template: `
    <div class="px-4 py-6 lg:px-6 lg:py-8">
      <div class="mx-auto max-w-2xl">
        @if (organization.isLoading()) {
          <rly-skeleton shape="block" height="20rem" />
        } @else if (organization.value(); as org) {
          <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 class="text-title-md text-ink">Configuración</h2>
              <p class="mt-1 text-ui text-text-secondary">
                Lo que ven los afiliados en el perfil de {{ org.name }}.
              </p>
            </div>

            <a rlyButton variant="tertiary" [routerLink]="['/organizaciones', org.slug]">
              Ver perfil público
              <rly-icon name="external-link" [size]="14" />
            </a>
          </header>

          <form class="mt-6 flex flex-col gap-6" [formGroup]="form" (ngSubmit)="save()">
            <section
              class="rounded-lg border border-border bg-surface p-5"
              aria-labelledby="identidad"
            >
              <h3 id="identidad" class="text-title-xs text-ink">Identidad</h3>

              <div class="mt-4 flex flex-col gap-5">
                <rly-field
                  label="Nombre"
                  required
                  [error]="errorFor('name', 'Escribe el nombre de la organización')"
                >
                  <input rlyInput type="text" formControlName="name" />
                </rly-field>

                <rly-field label="Tipo" required>
                  <rly-select>
                    <select rlySelect formControlName="kind">
                      @for (kind of kinds; track kind) {
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
                  label="Qué vendéis"
                  hint="Una línea, bajo el nombre en el perfil público"
                  required
                  [error]="errorFor('tagline', 'Describe la oferta en una línea')"
                >
                  <input rlyInput type="text" formControlName="tagline" />
                </rly-field>

                <rly-field
                  label="Descripción"
                  hint="Dos o tres frases sobre qué hacéis y para quién"
                >
                  <textarea rlyTextarea rows="5" formControlName="description"></textarea>
                </rly-field>

                <div class="grid gap-5 sm:grid-cols-2">
                  <rly-field label="Sitio web" optionalHint>
                    <input rlyInput type="text" formControlName="website" />
                  </rly-field>

                  <rly-field label="Ubicación" required>
                    <input rlyInput type="text" formControlName="location" />
                  </rly-field>
                </div>
              </div>
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

          <!-- Lo que no se edita -->
          <section
            class="mt-6 rounded-lg border border-border bg-surface p-5"
            aria-labelledby="confianza"
          >
            <h3 id="confianza" class="text-title-xs text-ink">Señales de confianza</h3>
            <p class="mt-1 text-ui-sm text-text-secondary">
              No se editan: se obtienen operando. Un afiliado no podría fiarse de ellas si
              cualquiera pudiera activarlas.
            </p>

            <div class="mt-4 flex flex-wrap gap-1.5">
              @for (signal of org.trustSignals; track signal) {
                <rly-badge tone="neutral" outline>{{ trustLabel(signal) }}</rly-badge>
              }
              @if (!org.trustSignals.length) {
                <p class="text-ui-sm text-text-muted">Todavía ninguna.</p>
              }
            </div>

            <dl class="mt-5 border-t border-border pt-4">
              <div class="flex items-baseline justify-between gap-3">
                <dt class="text-ui-sm text-text-secondary">Plan actual</dt>
                <dd class="text-ui font-medium text-ink">{{ planLabel(org.plan) }}</dd>
              </div>
            </dl>

            <p class="mt-3 text-ui-sm text-text-muted">
              RELAY no integra facturación: el plan forma parte del modelo de negocio ficticio del
              proyecto.
            </p>
          </section>

          <section class="mt-6" aria-labelledby="demo">
            <h3 id="demo" class="sr-only">Modo demo</h3>
            <rly-demo-controls />
          </section>
        }
      </div>
    </div>
  `,
})
export class OrganizationSettingsPage {
  private readonly builder = inject(FormBuilder);
  private readonly catalog = inject(CatalogRepository);
  private readonly toasts = inject(ToastService);

  readonly organizationId = input.required<string>();

  protected readonly kinds = KINDS;
  protected readonly categories = CATEGORIES;
  protected readonly busy = signal(false);
  protected readonly saved = signal(false);

  protected readonly organization = rxResource({
    params: () => this.organizationId(),
    stream: ({ params }) => this.catalog.organization(params),
  });

  protected readonly form: FormGroup = this.builder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    kind: ['company' as OrganizationKind, Validators.required],
    categoryId: ['servicios', Validators.required],
    tagline: ['', [Validators.required, Validators.minLength(8)]],
    description: [''],
    website: [''],
    location: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const organization = this.organization.value();
      if (!organization) return;

      this.form.patchValue(
        {
          name: organization.name,
          kind: organization.kind,
          categoryId: organization.categoryId,
          tagline: organization.tagline,
          description: organization.description,
          website: organization.website,
          location: organization.location,
        },
        { emitEvent: false },
      );
    });
  }

  protected errorFor(name: string, message: string): string | null {
    const control = this.form.get(name);
    return control && control.invalid && control.touched ? message : null;
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
        this.catalog.updateOrganization(this.organizationId(), {
          name: values.name,
          kind: values.kind,
          categoryId: values.categoryId as never,
          tagline: values.tagline,
          description: values.description,
          website: values.website,
          location: values.location,
        }),
      );

      this.organization.reload();
      this.saved.set(true);
      this.toasts.success('Organización actualizada');
    } catch {
      this.toasts.error('No se pudieron guardar los cambios');
    } finally {
      this.busy.set(false);
    }
  }

  protected kindLabel(kind: OrganizationKind): string {
    return ORGANIZATION_KIND_LABELS[kind];
  }

  protected trustLabel(signal: string): string {
    return TRUST_SIGNAL_LABELS[signal as keyof typeof TRUST_SIGNAL_LABELS] ?? signal;
  }

  protected planLabel(plan: string): string {
    return PLAN_LABELS[plan as keyof typeof PLAN_LABELS] ?? plan;
  }
}
