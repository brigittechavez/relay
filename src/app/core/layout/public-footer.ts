import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Logo } from '@ds/logo/logo';

interface FooterGroup {
  readonly title: string;
  readonly links: readonly { readonly label: string; readonly link: string }[];
}

const GROUPS: readonly FooterGroup[] = [
  {
    title: 'Producto',
    links: [
      { label: 'Marketplace', link: '/marketplace' },
      { label: 'Cómo funciona', link: '/como-funciona' },
      { label: 'Precios', link: '/pricing' },
    ],
  },
  {
    title: 'Para empresas',
    links: [
      { label: 'Crear un programa', link: '/para-empresas' },
      { label: 'Demo de empresa', link: '/app/organization/norte-digital/overview' },
    ],
  },
  {
    title: 'Para afiliados',
    links: [
      { label: 'Explorar campañas', link: '/marketplace' },
      { label: 'Demo de afiliado', link: '/app/affiliate/inicio' },
    ],
  },
];

/**
 * Pie del área pública.
 *
 * Incluye el aviso de proyecto ficticio: RELAY no es un servicio real y la
 * interfaz no debe dar a entender lo contrario en ningún punto de salida.
 */
@Component({
  selector: 'rly-public-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Logo],
  host: { class: 'block border-t border-border bg-surface' },
  template: `
    <div class="container-page py-12 lg:py-16">
      <div class="grid gap-10 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <rly-logo />
          <p class="mt-4 max-w-xs text-ui text-text-secondary">
            Marketplace de afiliación para servicios, productos y suscripciones profesionales.
          </p>
        </div>

        @for (group of groups; track group.title) {
          <nav [attr.aria-label]="group.title">
            <h2 class="text-label uppercase text-text-muted">{{ group.title }}</h2>
            <ul class="mt-4 flex flex-col gap-2.5">
              @for (item of group.links; track item.link) {
                <li>
                  <a
                    [routerLink]="item.link"
                    class="focus-ring rounded-xs text-ui text-text-secondary transition-colors
                           duration-micro hover:text-ink"
                  >
                    {{ item.label }}
                  </a>
                </li>
              }
            </ul>
          </nav>
        }
      </div>

      <div
        class="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-ui-sm text-text-muted
               sm:flex-row sm:items-center sm:justify-between"
      >
        <p>RELAY · Proyecto de portafolio. No es un servicio real y no procesa pagos.</p>
        <p>Datos, métricas y organizaciones son ficticios.</p>
      </div>
    </div>
  `,
})
export class PublicFooter {
  protected readonly groups = GROUPS;
}
