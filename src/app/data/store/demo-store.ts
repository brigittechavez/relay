import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { buildSeed, DemoDatabase, DEMO_SCHEMA_VERSION } from './demo-database';

const STORAGE_KEY = 'relay:demo';

/**
 * Estado de la demo y su persistencia.
 *
 * La abstracción es deliberada: la aplicación nunca habla con `localStorage`,
 * habla con este store. Sustituir la persistencia local por un backend real
 * significa reimplementar esta clase, no tocar las vistas.
 *
 * En el servidor no hay almacenamiento: se sirve el seed en memoria, que es lo
 * correcto para prerender y SSR —el HTML público no debe depender del estado
 * privado de nadie.
 */
@Injectable({ providedIn: 'root' })
export class DemoStore {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private database: DemoDatabase = this.restore();

  /** Se incrementa en cada escritura: las consultas derivadas lo observan. */
  readonly revision = signal(0);

  /** Acceso de solo lectura. Mutar el resultado no persiste nada. */
  read(): DemoDatabase {
    return this.database;
  }

  /**
   * Aplica un cambio y persiste.
   *
   * El mutador recibe la base de datos viva; devolver un valor lo propaga al
   * llamante, que es lo que permite a los manejadores del mock API responder
   * con el registro que acaban de crear.
   */
  write<T>(mutator: (database: DemoDatabase) => T): T {
    const result = mutator(this.database);
    this.persist();
    this.revision.update((value) => value + 1);
    return result;
  }

  /** Vuelve a los datos originales del seed y descarta la sesión. */
  reset(): void {
    this.database = buildSeed();
    this.persist();
    this.revision.update((value) => value + 1);
  }

  private restore(): DemoDatabase {
    if (!this.isBrowser) {
      return buildSeed();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildSeed();

      const parsed = JSON.parse(raw) as DemoDatabase;

      // Un esquema anterior se descarta en lugar de migrarse: es una demo, y
      // arrastrar migraciones aquí no aportaría nada al proyecto.
      return parsed.version === DEMO_SCHEMA_VERSION ? parsed : buildSeed();
    } catch {
      return buildSeed();
    }
  }

  private persist(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
    } catch {
      // Cuota agotada o almacenamiento bloqueado: la demo sigue funcionando en
      // memoria durante la sesión, que es el comportamiento menos molesto.
    }
  }
}
