import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Icon } from '../icon/icon';
import { Button } from './button';

const meta: Meta<Button> = {
  title: 'Primitivos/Button',
  component: Button,
  decorators: [moduleMetadata({ imports: [Button, Icon] })],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary', 'ghost', 'danger'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  args: { variant: 'primary', size: 'md', disabled: false, loading: false, block: false },
  parameters: {
    docs: {
      description: {
        component:
          'Botón de RELAY. Es un componente de atributo sobre `<button>` o `<a>`, de modo que ' +
          'conserva la semántica nativa y `routerLink`. Regla de composición: una vista tiene ' +
          'un único `primary`, uno o dos `secondary` y el resto en `tertiary`/`ghost`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Button>;

export const Primario: Story = {
  render: (args) => ({
    props: args,
    template: `
      <button rlyButton [variant]="variant" [size]="size" [disabled]="disabled"
              [loading]="loading" [block]="block">
        Aplicar a la campaña
      </button>
    `,
  }),
};

export const Variantes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button rlyButton variant="primary">Aplicar</button>
        <button rlyButton variant="secondary">Guardar cambios</button>
        <button rlyButton variant="tertiary">Ver requisitos</button>
        <button rlyButton variant="ghost">Cancelar</button>
        <button rlyButton variant="danger">Rechazar solicitud</button>
      </div>
    `,
  }),
};

export const Tamanos: Story = {
  name: 'Tamaños',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button rlyButton variant="primary" size="sm">Pequeño</button>
        <button rlyButton variant="primary" size="md">Mediano</button>
        <button rlyButton variant="primary" size="lg">Grande</button>
      </div>
    `,
  }),
};

export const ConIconos: Story = {
  name: 'Con iconos',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button rlyButton variant="primary">
          <rly-icon name="plus" [size]="16" />
          Crear campaña
        </button>
        <button rlyButton variant="tertiary">
          Ver campaña
          <rly-icon name="arrow-up-right" [size]="16" />
        </button>
        <button rlyButton variant="tertiary" iconOnly aria-label="Guardar campaña">
          <rly-icon name="bookmark" [size]="18" />
        </button>
      </div>
    `,
  }),
};

export const Estados: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button rlyButton variant="primary">Normal</button>
        <button rlyButton variant="primary" loading>Enviando solicitud</button>
        <button rlyButton variant="primary" disabled>No disponible</button>
        <button rlyButton variant="tertiary" disabled>No elegible</button>
      </div>
    `,
  }),
};

export const SobreFondoOscuro: Story = {
  name: 'Sobre bloque Ink',
  parameters: { controls: { disable: true }, backgrounds: { value: 'ink' } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3 p-6">
        <button rlyButton variant="primary" onInverse>Explorar campañas</button>
        <button rlyButton variant="secondary" onInverse>Crear un programa</button>
        <button rlyButton variant="tertiary" onInverse>Cómo funciona</button>
        <button rlyButton variant="ghost" onInverse>Saber más</button>
      </div>
    `,
  }),
};
