import { effect, inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { SeoService } from './seo.service';

/**
 * Aplica los metadatos declarados en `data` de cada ruta.
 *
 * Las páginas estáticas no necesitan hacer nada: declaran `title` y
 * `description` junto a la ruta y esto los aplica. Las dinámicas —campaña,
 * perfil— los sobrescriben con sus propios datos en cuanto los cargan, que es
 * lo que hace que un enlace compartido muestre el nombre de la campaña.
 */
@Injectable({ providedIn: 'root' })
export class RouteMetadata {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  private readonly current = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.leaf()),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const snapshot = this.current();
      if (!snapshot) return;

      const data = snapshot.data as { title?: string; description?: string };
      if (!data.title) return;

      this.seo.apply({
        title: data.title,
        description: data.description,
        path: this.router.url.split('?')[0],
      });
    });
  }

  private leaf(): ActivatedRouteSnapshot | null {
    let snapshot: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;

    while (snapshot?.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot;
  }
}
