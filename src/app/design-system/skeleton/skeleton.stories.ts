import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Card } from '../card/card';
import { Skeleton } from './skeleton';

const meta: Meta<Skeleton> = {
  title: 'Primitivos/Skeleton',
  component: Skeleton,
  decorators: [moduleMetadata({ imports: [Skeleton, Card] })],
  argTypes: { shape: { control: 'inline-radio', options: ['text', 'block', 'circle'] } },
  args: { shape: 'text', width: '12rem' },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'El skeleton reserva el espacio exacto del contenido que sustituye. Su función es ' +
          'evitar el salto de layout, no decorar la espera.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Skeleton>;

export const Basico: Story = {
  name: 'Básico',
  render: (args) => ({ props: args, template: `<rly-skeleton [shape]="shape" [width]="width" />` }),
};

export const TarjetaDeCampana: Story = {
  name: 'Tarjeta de campaña',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="max-w-sm">
        <rly-card padding="none">
          <rly-skeleton shape="block" height="10rem" class="rounded-b-none" />
          <div class="flex flex-col gap-2.5 p-5">
            <rly-skeleton width="40%" />
            <rly-skeleton width="85%" height="1.125rem" />
            <rly-skeleton width="60%" />
          </div>
        </rly-card>
      </div>
    `,
  }),
};
