import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { IconName } from '../icon/icon-registry.generated';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
  readonly icon: IconName | null;
  /** Acción opcional; una sola, para no convertir el aviso en un diálogo. */
  readonly action: { readonly label: string; readonly run: () => void } | null;
}

interface ToastOptions {
  readonly tone?: ToastTone;
  readonly icon?: IconName;
  readonly action?: { readonly label: string; readonly run: () => void };
  readonly duration?: number;
}

const DEFAULT_DURATION = 4500;

/**
 * Avisos efímeros.
 *
 * RELAY los usa para confirmar acciones ya ocurridas —link copiado, solicitud
 * enviada, demo restablecida—, nunca para pedir decisiones ni para comunicar
 * errores de formulario, que se muestran junto al campo.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private sequence = 0;

  private readonly items = signal<readonly Toast[]>([]);

  readonly toasts = this.items.asReadonly();

  show(message: string, options: ToastOptions = {}): void {
    if (!this.isBrowser) return;

    const toast: Toast = {
      id: ++this.sequence,
      message,
      tone: options.tone ?? 'neutral',
      icon: options.icon ?? null,
      action: options.action ?? null,
    };

    this.items.update((current) => [...current, toast]);

    setTimeout(() => this.dismiss(toast.id), options.duration ?? DEFAULT_DURATION);
  }

  success(message: string, options: Omit<ToastOptions, 'tone'> = {}): void {
    this.show(message, { ...options, tone: 'success', icon: options.icon ?? 'check-circle' });
  }

  error(message: string, options: Omit<ToastOptions, 'tone'> = {}): void {
    this.show(message, { ...options, tone: 'danger', icon: options.icon ?? 'alert' });
  }

  dismiss(id: number): void {
    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.items.set([]);
  }
}
