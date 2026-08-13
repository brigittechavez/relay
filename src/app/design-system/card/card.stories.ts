import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Badge } from '../badge/badge';
import { Card } from './card';

const meta: Meta<Card> = {
  title: 'Primitivos/Card',
  component: Card,
  decorators: [moduleMetadata({ imports: [Card, Badge] })],
  argTypes: {
    surface: { control: 'inline-radio', options: ['surface', 'muted', 'inverse', 'accent'] },
    padding: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
  },
  args: { surface: 'surface', padding: 'md', interactive: false },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Superficie base. Las tarjetas se separan del fondo con borde, no con sombra: la ' +
          'elevación queda reservada a modales, drawers y menús.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Card>;

export const Basica: Story = {
  name: 'Básica',
  render: (args) => ({
    props: args,
    template: `
      <div class="max-w-sm">
        <rly-card [surface]="surface" [padding]="padding" [interactive]="interactive">
          <p class="text-title-xs text-ink">Landing Pro</p>
          <p class="mt-1 text-ui text-text-secondary">Norte Digital · Servicios profesionales</p>
        </rly-card>
      </div>
    `,
  }),
};

export const Superficies: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="grid gap-4 sm:grid-cols-2">
        <rly-card surface="surface">
          <p class="text-title-xs">Surface</p>
          <p class="mt-1 text-ui text-text-secondary">Tarjetas de contenido y tablas.</p>
        </rly-card>
        <rly-card surface="muted">
          <p class="text-title-xs">Muted</p>
          <p class="mt-1 text-ui text-text-secondary">Bloques secundarios y resúmenes.</p>
        </rly-card>
        <rly-card surface="accent">
          <p class="text-title-xs">Accent</p>
          <p class="mt-1 text-ui text-text-secondary">Una señal por vista, nunca más.</p>
        </rly-card>
        <rly-card surface="inverse">
          <p class="text-title-xs">Inverse</p>
          <p class="mt-1 text-ui text-text-inverse-secondary">Momentos editoriales oscuros.</p>
        </rly-card>
      </div>
    `,
  }),
};
