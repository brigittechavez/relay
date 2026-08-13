import type { Meta, StoryObj } from '@storybook/angular-vite';

const meta: Meta = {
  title: 'RELAY/Introducción',
  parameters: { layout: 'fullscreen' },
  render: () => ({
    template: `
      <section class="p-10 font-sans">
        <p class="text-xs uppercase tracking-widest text-neutral-500">Design system</p>
        <h1 class="mt-2 text-4xl font-semibold text-neutral-900">RELAY</h1>
        <p class="mt-3 max-w-prose text-neutral-600">
          Primitivos y componentes de dominio de RELAY. Cada story documenta los estados
          relevantes del componente.
        </p>
      </section>
    `,
  }),
};

export default meta;
type Story = StoryObj;

export const Bienvenida: Story = {};
