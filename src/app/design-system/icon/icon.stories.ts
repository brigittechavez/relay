import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Icon } from './icon';
import { ICON_NAMES } from './icon-registry.generated';

const meta: Meta<Icon> = {
  title: 'Primitivos/Icon',
  component: Icon,
  decorators: [moduleMetadata({ imports: [Icon] })],
  argTypes: { name: { control: 'select', options: ICON_NAMES } },
  args: { name: 'campaigns', size: 20, strokeWidth: 1.75, label: '' },
  parameters: {
    docs: {
      description: {
        component:
          'Subconjunto cerrado de Lucide extraído en build a un registro tipado: no hay librería ' +
          'de iconos en runtime y el nombre lo valida el compilador. RELAY no usa emojis como ' +
          'iconografía. Los canales de difusión se representan con iconos genéricos, no con ' +
          'marcas ajenas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Icon>;

export const Individual: Story = {
  render: (args) => ({
    props: args,
    template: `<rly-icon [name]="name" [size]="size" [strokeWidth]="strokeWidth" [label]="label" />`,
  }),
};

export const Catalogo: Story = {
  name: 'Catálogo',
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => ({
    props: { names: ICON_NAMES },
    template: `
      <ul class="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
        @for (name of names; track name) {
          <li class="flex flex-col items-center gap-2 rounded-md border border-border bg-surface p-3">
            <rly-icon [name]="name" [size]="20" />
            <span class="text-center text-[0.6875rem] leading-tight text-text-muted">{{ name }}</span>
          </li>
        }
      </ul>
    `,
  }),
};
