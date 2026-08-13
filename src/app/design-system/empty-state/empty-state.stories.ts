import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Button } from '../button/button';
import { Card } from '../card/card';
import { EmptyState } from './empty-state';

const meta: Meta<EmptyState> = {
  title: 'Primitivos/Empty state',
  component: EmptyState,
  decorators: [moduleMetadata({ imports: [EmptyState, Button, Card] })],
  args: {
    icon: 'bookmark',
    title: 'Todavía no has guardado campañas',
    description: 'Guarda las oportunidades que te interesen para compararlas después.',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Un icono, un titular corto, una frase y una sola acción. RELAY no usa ilustraciones: ' +
          'el vacío se resuelve explicando qué falta y qué hacer.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<EmptyState>;

export const ConAccion: Story = {
  name: 'Con acción',
  render: (args) => ({
    props: args,
    template: `
      <rly-card>
        <rly-empty-state [icon]="icon" [title]="title" [description]="description">
          <button rlyButton variant="primary">Explorar el marketplace</button>
        </rly-empty-state>
      </rly-card>
    `,
  }),
};

export const SinResultados: Story = {
  name: 'Sin resultados',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <rly-card>
        <rly-empty-state
          icon="search"
          title="Ninguna campaña coincide con estos filtros"
          description="Prueba a quitar el filtro de comisión recurrente o a ampliar la categoría."
        >
          <button rlyButton variant="tertiary">Limpiar filtros</button>
        </rly-empty-state>
      </rly-card>
    `,
  }),
};
