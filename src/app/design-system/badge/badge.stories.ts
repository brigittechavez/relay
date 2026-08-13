import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Badge } from './badge';

const meta: Meta<Badge> = {
  title: 'Primitivos/Badge',
  component: Badge,
  decorators: [moduleMetadata({ imports: [Badge] })],
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'accent', 'success', 'warning', 'danger', 'info', 'inverse'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  args: { tone: 'neutral', size: 'sm', outline: false, dot: false },
  parameters: {
    docs: {
      description: {
        component:
          'Etiqueta de estado o metadato. El texto siempre nombra el estado: el color y el punto ' +
          'refuerzan, nunca sustituyen a la palabra.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Badge>;

export const Basico: Story = {
  name: 'Básico',
  render: (args) => ({
    props: args,
    template: `<rly-badge [tone]="tone" [size]="size" [outline]="outline" [dot]="dot">Activa</rly-badge>`,
  }),
};

export const EstadosDeCampana: Story = {
  name: 'Estados de campaña',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <rly-badge tone="success" dot>Activa</rly-badge>
        <rly-badge tone="warning" dot>Pausada</rly-badge>
        <rly-badge tone="neutral" dot>Borrador</rly-badge>
        <rly-badge tone="info" dot>Programada</rly-badge>
        <rly-badge tone="neutral">Finalizada</rly-badge>
      </div>
    `,
  }),
};

export const EstadosDeSolicitud: Story = {
  name: 'Estados de solicitud',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <rly-badge tone="neutral">Borrador</rly-badge>
        <rly-badge tone="info">Enviada</rly-badge>
        <rly-badge tone="warning">En revisión</rly-badge>
        <rly-badge tone="success">Aprobada</rly-badge>
        <rly-badge tone="danger">Rechazada</rly-badge>
      </div>
    `,
  }),
};

export const Contorno: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <rly-badge tone="accent" outline>Recurrente</rly-badge>
        <rly-badge tone="neutral" outline>Perú</rly-badge>
        <rly-badge tone="success" outline>Aceptación inmediata</rly-badge>
      </div>
    `,
  }),
};
