import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Button } from '../button/button';
import { ToastHost } from './toast-host';
import { ToastService } from './toast.service';

@Component({
  selector: 'rly-toast-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastHost, Button],
  template: `
    <rly-toast-host />

    <div class="flex flex-wrap items-center gap-3">
      <button rlyButton variant="tertiary" (click)="copyLink()">Copiar link</button>
      <button rlyButton variant="primary" (click)="submitApplication()">Enviar solicitud</button>
      <button rlyButton variant="danger" (click)="failReset()">Provocar un error</button>
    </div>
  `,
})
class ToastDemo {
  private readonly toasts = inject(ToastService);

  protected copyLink(): void {
    this.toasts.success('Link copiado al portapapeles');
  }

  protected submitApplication(): void {
    this.toasts.show('Solicitud enviada a Norte Digital', {
      icon: 'send',
      action: { label: 'Ver solicitud', run: () => undefined },
    });
  }

  protected failReset(): void {
    this.toasts.error('No se pudo restablecer la demo');
  }
}

const meta: Meta<ToastDemo> = {
  title: 'Overlays/Toast',
  component: ToastDemo,
  decorators: [moduleMetadata({ imports: [ToastDemo] })],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Avisos efímeros para confirmar acciones ya ocurridas. No se usan para pedir ' +
          'decisiones ni para errores de formulario, que se muestran junto al campo. La región ' +
          'es `aria-live="polite"`, así que no interrumpe la tarea en curso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<ToastDemo>;

export const Avisos: Story = {};
