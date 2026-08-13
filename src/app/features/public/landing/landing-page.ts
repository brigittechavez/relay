import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { Campaign } from '@data/models/campaign';
import { CampaignCard } from '@domain/campaign-card/campaign-card';
import { PLANS } from '../pricing/plans';
import { LandingHero } from './landing-hero';

/** Los dos recorridos del producto, tal y como los describe la documentación. */
const PATHS = [
  {
    id: 'affiliate',
    eyebrow: 'Para afiliados',
    title: 'Encuentra campañas que encajan con lo que ya publicas',
    body:
      'Cada campaña dice qué conversión paga, cuánto y qué requisitos pide. Antes de solicitar ' +
      'ves tu compatibilidad y qué te falta, así que dejas de aplicar a ciegas.',
    steps: [
      'Descubre campañas filtradas por nicho, canal y comisión',
      'Comprueba tu compatibilidad y los requisitos que cumples',
      'Solicita y, al ser aprobado, genera tus links y tu código',
      'Sigue clics, conversiones y comisiones desde un solo lugar',
    ],
    cta: { label: 'Ver demo como afiliado', link: '/login' },
  },
  {
    id: 'organization',
    eyebrow: 'Para empresas y profesionales',
    title: 'Consigue clientes con quien ya tiene la audiencia adecuada',
    body:
      'Publica tu programa, define qué conversión paga comisión y revisa quién quiere ' +
      'promocionarlo. Sin negociar cada colaboración por separado.',
    steps: [
      'Crea la campaña en cuatro pasos y define la comisión',
      'Elige la modalidad: abierta, selectiva o premium',
      'Revisa solicitudes con el perfil y la compatibilidad delante',
      'Mide conversiones, revenue atribuido y comisiones pendientes',
    ],
    cta: { label: 'Ver demo como empresa', link: '/login' },
  },
] as const;

/** Señales de confianza que RELAY sí modela: operativas, no reseñas. */
const TRUST = [
  { icon: 'shield-check', label: 'Organizaciones verificadas' },
  { icon: 'clock', label: 'Tiempo medio de revisión visible' },
  { icon: 'commissions', label: 'Condiciones de comisión explícitas' },
  { icon: 'analytics', label: 'Resultados por link y por canal' },
] as const;

/**
 * Portada.
 *
 * Se prerenderiza, así que las campañas que muestra viajan ya en el HTML: el
 * hero no espera a una petición para tener contenido y no hay salto de layout
 * al hidratar.
 */
@Component({
  selector: 'rly-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon, CampaignCard, LandingHero],
  host: { class: 'block' },
  template: `
    <rly-landing-hero
      [campaigns]="heroCampaigns()"
      [organizations]="organizations.value()"
      [campaignCount]="campaignCount()"
      [affiliateCount]="affiliateReach()"
      [averageConversionRate]="averageConversionRate()"
    />

    <!-- Oportunidades reales del marketplace -->
    <section class="container-page relative -mt-10 pb-[var(--rly-layout-section-y)] lg:-mt-16" aria-labelledby="oportunidades">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="max-w-xl">
          <p [class]="eyebrow">Oportunidades</p>
          <h2 id="oportunidades" class="mt-2 text-title-lg text-ink">
            Campañas abiertas ahora mismo
          </h2>
        </div>

        <a rlyButton variant="tertiary" routerLink="/marketplace">
          Ver todas
          <rly-icon name="arrow-right" [size]="16" />
        </a>
      </div>

      <div class="grid-cards mt-8">
        @for (campaign of previewCampaigns(); track campaign.id) {
          <rly-campaign-card
            [campaign]="campaign"
            [organization]="organizationFor(campaign)"
            [showSave]="false"
          />
        }
      </div>
    </section>

    <!-- Los dos lados del marketplace -->
    @for (path of paths; track path.id; let index = $index) {
      <section
        class="section-y"
        [class.bg-surface]="index === 0"
        [class.bg-inverse]="index === 1"
        [attr.aria-labelledby]="path.id"
      >
        <div class="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p [class]="index === 1 ? eyebrowInverse : eyebrow">{{ path.eyebrow }}</p>
            <h2
              [id]="path.id"
              class="mt-2 text-title-lg"
              [class.text-ink]="index === 0"
              [class.text-text-inverse]="index === 1"
            >
              {{ path.title }}
            </h2>
            <p
              class="mt-4 max-w-lg text-body-lg"
              [class.text-text-secondary]="index === 0"
              [class.text-text-inverse-secondary]="index === 1"
            >
              {{ path.body }}
            </p>

            <a
              rlyButton
              [variant]="index === 1 ? 'primary' : 'secondary'"
              [onInverse]="index === 1"
              class="mt-8"
              [routerLink]="path.cta.link"
            >
              {{ path.cta.label }}
              <rly-icon name="arrow-right" [size]="16" />
            </a>
          </div>

          <ol class="flex flex-col">
            @for (step of path.steps; track step; let stepIndex = $index) {
              <li
                class="flex gap-4 border-t py-5 first:border-t-0 first:pt-0"
                [class.border-border]="index === 0"
                [class.border-border-inverse]="index === 1"
              >
                <span
                  class="grid size-7 shrink-0 place-items-center rounded-sm text-ui-sm font-semibold
                         tabular-nums"
                  [class.bg-surface-muted]="index === 0"
                  [class.text-ink]="index === 0"
                  [class.bg-accent]="index === 1"
                  [class.text-accent-contrast]="index === 1"
                >
                  {{ stepIndex + 1 }}
                </span>
                <span
                  class="pt-0.5 text-body"
                  [class.text-text-secondary]="index === 0"
                  [class.text-text-inverse-secondary]="index === 1"
                >
                  {{ step }}
                </span>
              </li>
            }
          </ol>
        </div>
      </section>
    }

    <!-- Señales de confianza -->
    <section class="container-page section-y" aria-labelledby="confianza">
      <div class="max-w-xl">
        <p [class]="eyebrow">Cómo se decide</p>
        <h2 id="confianza" class="mt-2 text-title-lg text-ink">
          La información que hace falta para decidir, en la propia campaña
        </h2>
        <p class="mt-4 text-body-lg text-text-secondary">
          RELAY no tiene reseñas ni valoraciones. La confianza se construye con datos
          operativos: cuánto tarda una organización en revisar, cuántas solicitudes aprueba y qué
          rendimiento tiene cada campaña.
        </p>
      </div>

      <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (signal of trust; track signal.label; let index = $index) {
          <li [class]="index === 1 ? trustTileInverse : trustTile">
            <span [class]="index === 1 ? trustIconInverse : trustIcon" aria-hidden="true">
              <rly-icon [name]="signal.icon" [size]="18" />
            </span>
            <p
              class="mt-3 text-ui font-medium"
              [class.text-ink]="index !== 1"
              [class.text-text-inverse]="index === 1"
            >
              {{ signal.label }}
            </p>
          </li>
        }
      </ul>
    </section>

    <!-- Planes -->
    <section class="border-t border-border bg-surface section-y" aria-labelledby="planes">
      <div class="container-page">
        <div class="max-w-xl">
          <p [class]="eyebrow">Planes</p>
          <h2 id="planes" class="mt-2 text-title-lg text-ink">
            Gratis para afiliados. Por volumen para organizaciones.
          </h2>
        </div>

        <ul class="mt-8 grid gap-4 lg:grid-cols-3">
          @for (plan of plans; track plan.id) {
            <li
              class="flex flex-col rounded-lg border p-6"
              [class.border-border]="!plan.highlighted"
              [class.bg-canvas]="!plan.highlighted"
              [class.border-ink]="plan.highlighted"
              [class.bg-surface]="plan.highlighted"
            >
              <p class="text-title-xs text-ink">{{ plan.name }}</p>
              <p class="mt-1 text-ui-sm text-text-secondary">{{ plan.audience }}</p>
              <p class="mt-4 text-title-md text-ink">{{ plan.price }}</p>
              <p class="mt-1 text-ui-sm text-text-muted">{{ plan.priceNote }}</p>
            </li>
          }
        </ul>

        <a rlyButton variant="tertiary" class="mt-8" routerLink="/pricing">
          Comparar planes
          <rly-icon name="arrow-right" [size]="16" />
        </a>
      </div>
    </section>

    <!-- CTA final -->
    <section class="bg-inverse section-y" aria-labelledby="empezar">
      <div class="container-page text-center">
        <h2 id="empezar" class="mx-auto max-w-3xl text-title-xl text-text-inverse">
          Recorre RELAY con datos ya cargados
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-body-lg text-text-inverse-secondary">
          Entra como afiliada y aplica a una campaña, o entra como empresa y revisa las
          solicitudes que esperan respuesta. Se puede restablecer en cualquier momento.
        </p>

        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a rlyButton variant="primary" size="lg" onInverse routerLink="/login">
            Entrar en la demo
          </a>
          <a rlyButton variant="tertiary" size="lg" onInverse routerLink="/como-funciona">
            Cómo funciona
          </a>
        </div>
      </div>
    </section>
  `,
})
export class LandingPage {
  private readonly catalog = inject(CatalogRepository);

  /** Etiqueta de sección: píldora con borde, no texto suelto. */
  protected readonly eyebrow =
    'inline-flex items-center rounded-full border border-border px-3 py-1 text-label ' +
    'uppercase text-text-secondary';

  protected readonly eyebrowInverse =
    'inline-flex items-center rounded-full border border-border-inverse px-3 py-1 text-label ' +
    'uppercase text-accent';

  protected readonly trustTile = 'rounded-lg border border-border bg-surface p-5';
  protected readonly trustTileInverse = 'rounded-lg border border-ink bg-inverse p-5';

  protected readonly trustIcon =
    'grid size-9 place-items-center rounded-sm bg-surface-muted text-ink';
  protected readonly trustIconInverse =
    'grid size-9 place-items-center rounded-sm bg-accent text-accent-contrast';

  protected readonly paths = PATHS;
  protected readonly trust = TRUST;
  protected readonly plans = PLANS;

  protected readonly organizations = rxResource({
    stream: () => this.catalog.listOrganizations(),
    defaultValue: [],
  });

  private readonly campaigns = rxResource({
    stream: () => this.catalog.listCampaigns({ sort: 'relevance', pageSize: 24 }),
  });

  private readonly items = computed(() => this.campaigns.value()?.items ?? []);

  protected readonly campaignCount = computed(() => this.campaigns.value()?.total ?? 0);

  /** Alcance combinado de los afiliados activos en todas las campañas. */
  protected readonly affiliateReach = computed(() =>
    this.items().reduce((total, campaign) => total + campaign.metrics.activeAffiliates, 0),
  );

  protected readonly averageConversionRate = computed(() => {
    const items = this.items();
    if (!items.length) return 0;

    const sum = items.reduce((total, campaign) => total + campaign.metrics.conversionRate, 0);
    return sum / items.length;
  });

  protected readonly heroCampaigns = computed(() => this.items().slice(0, 3));
  protected readonly previewCampaigns = computed(() => this.items().slice(0, 3));

  protected organizationFor(campaign: Campaign) {
    return this.organizations.value().find((item) => item.id === campaign.organizationId) ?? null;
  }
}
