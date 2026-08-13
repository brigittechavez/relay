import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { TabPanel, Tabs } from './tabs';

const meta: Meta<Tabs> = {
  title: 'Primitivos/Tabs',
  component: Tabs,
  decorators: [moduleMetadata({ imports: [Tabs, TabPanel] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Patrón ARIA completo: `tablist`, `tabindex` móvil y navegación con flechas, Inicio y ' +
          'Fin. Para las secciones que además son rutas se usa `rly-tab-nav`, con enlaces reales.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Tabs>;

export const WorkspaceDeCampana: Story = {
  name: 'Workspace de campaña',
  render: () => {
    const selected = signal('resumen');

    return {
      props: {
        selected,
        select: (id: string) => selected.set(id),
        tabs: [
          { id: 'resumen', label: 'Resumen' },
          { id: 'links', label: 'Links y códigos', count: 3 },
          { id: 'recursos', label: 'Recursos' },
          { id: 'rendimiento', label: 'Rendimiento' },
          { id: 'actividad', label: 'Actividad' },
        ],
      },
      template: `
        <rly-tabs [tabs]="tabs" [selected]="selected()" (selectedChange)="select($event)" />

        <rly-tab-panel [for]="selected()" class="pt-5">
          <p class="text-ui text-text-secondary">
            Contenido de la sección «{{ selected() }}».
          </p>
        </rly-tab-panel>
      `,
    };
  },
};
