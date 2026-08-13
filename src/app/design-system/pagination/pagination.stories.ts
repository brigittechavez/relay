import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Pagination } from './pagination';

const meta: Meta<Pagination> = {
  title: 'Primitivos/Pagination',
  component: Pagination,
  decorators: [moduleMetadata({ imports: [Pagination] })],
  args: { pageSize: 10, total: 128 },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'En móvil se reduce a anterior/siguiente más la posición: la lista de números no cabe ' +
          'sin comprimir los objetivos táctiles por debajo de lo aceptable.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Pagination>;

export const Listado: Story = {
  render: (args) => {
    const page = signal(4);

    return {
      props: { ...args, page, change: (next: number) => page.set(next) },
      template: `
        <rly-pagination
          [page]="page()"
          [pageSize]="pageSize"
          [total]="total"
          (pageChange)="change($event)"
        />
      `,
    };
  },
};

export const PocosResultados: Story = {
  name: 'Pocos resultados',
  args: { total: 24 },
  render: (args) => {
    const page = signal(1);

    return {
      props: { ...args, page, change: (next: number) => page.set(next) },
      template: `
        <rly-pagination
          [page]="page()"
          [pageSize]="pageSize"
          [total]="total"
          (pageChange)="change($event)"
        />
      `,
    };
  },
};
