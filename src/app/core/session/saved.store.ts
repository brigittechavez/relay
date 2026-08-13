import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ToastService } from '@ds/toast/toast.service';
import { EngagementRepository } from '@data/repositories/engagement.repository';

/**
 * Campañas y afiliados guardados, y la selección de comparación.
 *
 * La escritura es optimista: guardar una campaña se refleja en el acto y solo
 * se revierte si la petición falla. En una lista de tarjetas, esperar 180 ms a
 * que el icono cambie se percibe como que el clic no ha funcionado.
 */
@Injectable({ providedIn: 'root' })
export class SavedStore {
  private readonly repository = inject(EngagementRepository);
  private readonly toasts = inject(ToastService);

  private readonly campaigns = signal<readonly string[]>([]);
  private readonly affiliates = signal<readonly string[]>([]);
  private readonly compared = signal<readonly string[]>([]);
  private readonly loaded = signal(false);

  readonly savedCampaigns = this.campaigns.asReadonly();
  readonly savedAffiliates = this.affiliates.asReadonly();
  readonly comparedCampaigns = this.compared.asReadonly();

  readonly savedCount = computed(() => this.campaigns().length);
  readonly compareCount = computed(() => this.compared().length);

  isCampaignSaved(id: string): boolean {
    return this.campaigns().includes(id);
  }

  isAffiliateSaved(id: string): boolean {
    return this.affiliates().includes(id);
  }

  isCompared(id: string): boolean {
    return this.compared().includes(id);
  }

  async load(): Promise<void> {
    if (this.loaded()) return;

    const saved = await firstValueFrom(this.repository.saved());
    this.campaigns.set(saved.campaigns);
    this.affiliates.set(saved.affiliates);
    this.compared.set(saved.compared);
    this.loaded.set(true);
  }

  async toggleCampaign(id: string): Promise<void> {
    const previous = this.campaigns();
    const willSave = !previous.includes(id);

    this.campaigns.set(willSave ? [...previous, id] : previous.filter((item) => item !== id));

    try {
      await firstValueFrom(this.repository.toggleSaved('campaign', id));
      if (!willSave) {
        this.compared.update((items) => items.filter((item) => item !== id));
      }
    } catch {
      this.campaigns.set(previous);
      this.toasts.error('No se pudo actualizar la lista de guardados');
    }
  }

  async toggleAffiliate(id: string): Promise<void> {
    const previous = this.affiliates();
    const willSave = !previous.includes(id);

    this.affiliates.set(willSave ? [...previous, id] : previous.filter((item) => item !== id));

    try {
      await firstValueFrom(this.repository.toggleSaved('affiliate', id));
    } catch {
      this.affiliates.set(previous);
      this.toasts.error('No se pudo actualizar la lista de guardados');
    }
  }

  /** La comparación sí espera al servidor: el límite de tres lo impone él. */
  async toggleCompare(id: string): Promise<void> {
    try {
      const result = await firstValueFrom(this.repository.toggleCompare(id));
      this.compared.set(result.compared);
    } catch {
      this.toasts.error('Solo puedes comparar 3 campañas a la vez');
    }
  }

  /** Tras reiniciar la demo hay que volver a leer el estado guardado. */
  invalidate(): void {
    this.loaded.set(false);
    this.campaigns.set([]);
    this.affiliates.set([]);
    this.compared.set([]);
  }
}
