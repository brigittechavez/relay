import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Button } from '../button/button';
import { Checkbox } from '../choice/choice';
import { Drawer } from './drawer';

const meta: Meta<Drawer> = {
  title: 'Overlays/Drawer',
  component: Drawer,
  decorators: [moduleMetadata({ imports: [Drawer, Button, Checkbox] })],
  argTypes: { side: { control: 'inline-radio', options: ['responsive', 'right', 'bottom'] } },
  args: { title: 'Filtros', side: 'responsive' },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'En modo `responsive` es hoja inferior en móvil y panel lateral en escritorio, que es ' +
          'el patrón de los filtros del marketplace y de las solicitudes a campañas selectivas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Drawer>;

export const Filtros: Story = {
  render: (args) => {
    const open = signal(false);

    return {
      props: { ...args, open, close: () => open.set(false), show: () => open.set(true) },
      template: `
        <button rlyButton variant="tertiary" (click)="show()">Más filtros</button>

        <rly-drawer [open]="open()" [title]="title" [side]="side" (closed)="close()">
          <fieldset>
            <legend class="mb-3 text-ui-sm font-medium text-ink">Tipo de comisión</legend>
            <div class="flex flex-col gap-3">
              <label class="flex items-center gap-2.5 text-ui text-ink">
                <input rlyCheckbox type="checkbox" checked /> Recurrente
              </label>
              <label class="flex items-center gap-2.5 text-ui text-ink">
                <input rlyCheckbox type="checkbox" /> Monto fijo
              </label>
              <label class="flex items-center gap-2.5 text-ui text-ink">
                <input rlyCheckbox type="checkbox" /> Porcentaje por venta
              </label>
            </div>
          </fieldset>

          <button drawerFooter rlyButton variant="ghost" class="flex-1" (click)="close()">
            Limpiar
          </button>
          <button drawerFooter rlyButton variant="primary" class="flex-1" (click)="close()">
            Ver resultados
          </button>
        </rly-drawer>
      `,
    };
  },
};
