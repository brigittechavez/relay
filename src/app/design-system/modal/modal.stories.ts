import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Button } from '../button/button';
import { Modal } from './modal';

const meta: Meta<Modal> = {
  title: 'Overlays/Modal',
  component: Modal,
  decorators: [moduleMetadata({ imports: [Modal, Button] })],
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  args: {
    title: 'Confirmar adhesión',
    description: 'Landing Pro · Norte Digital',
    size: 'sm',
    persistent: false,
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'El foco queda atrapado en el panel, Escape cierra, el scroll del documento se bloquea ' +
          'y al cerrarse el foco vuelve al disparador. En móvil el panel se ancla abajo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Modal>;

export const Confirmacion: Story = {
  name: 'Confirmación',
  render: (args) => {
    const open = signal(false);

    return {
      props: { ...args, open, close: () => open.set(false), show: () => open.set(true) },
      template: `
        <button rlyButton variant="primary" (click)="show()">Unirme a la campaña</button>

        <rly-modal
          [open]="open()"
          [title]="title"
          [description]="description"
          [size]="size"
          [persistent]="persistent"
          (closed)="close()"
        >
          <p class="text-ui text-text-secondary">
            Al unirte se generará tu link de seguimiento y tu código promocional. Podrás
            abandonar la campaña cuando quieras; el historial se conserva.
          </p>

          <button modalFooter rlyButton variant="ghost" (click)="close()">Cancelar</button>
          <button modalFooter rlyButton variant="primary" (click)="close()">
            Confirmar adhesión
          </button>
        </rly-modal>
      `,
    };
  },
};
