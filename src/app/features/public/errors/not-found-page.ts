import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '@ds/button/button';
import { Icon } from '@ds/icon/icon';

/**
 * 404.
 *
 * Con identidad propia y dos salidas reales, no una sola: quien llega aquí
 * puede estar buscando la portada o una campaña concreta.
 */
@Component({
  selector: 'rly-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  host: { class: 'block' },
  template: `
    <div class="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p class="text-display leading-none text-ink">404</p>

      <h1 class="mt-6 text-title-md text-ink">Este enlace no lleva a ninguna parte</h1>
      <p class="mt-3 max-w-md text-body-lg text-text-secondary">
        La página que buscas no existe o ha cambiado de dirección. El marketplace sigue en su
        sitio.
      </p>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a rlyButton variant="primary" routerLink="/marketplace">
          Explorar campañas
          <rly-icon name="arrow-right" [size]="16" />
        </a>
        <a rlyButton variant="tertiary" routerLink="/">Volver al inicio</a>
      </div>
    </div>
  `,
})
export class NotFoundPage {}
