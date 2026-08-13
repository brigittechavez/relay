import type { Meta, StoryObj } from '@storybook/angular-vite';

const COLORS = [
  { group: 'Marca', tokens: ['accent', 'accent-hover', 'accent-soft'] },
  {
    group: 'Superficies',
    tokens: ['canvas', 'surface', 'surface-muted', 'inverse', 'inverse-elevated'],
  },
  { group: 'Texto', tokens: ['ink', 'text-secondary', 'text-muted', 'text-inverse'] },
  { group: 'Bordes', tokens: ['border', 'border-strong', 'border-inverse'] },
  { group: 'Estado', tokens: ['success', 'warning', 'danger', 'info'] },
];

const TYPE = [
  { token: 'display', use: 'Hero de la portada' },
  { token: 'title-xl', use: 'H1 de páginas de marketing' },
  { token: 'title-lg', use: 'Encabezado de sección' },
  { token: 'title-md', use: 'H1 dentro de la aplicación' },
  { token: 'title-sm', use: 'Encabezado de bloque' },
  { token: 'title-xs', use: 'Título de tarjeta y de diálogo' },
  { token: 'kpi', use: 'Cifra principal de un KPI' },
  { token: 'body-lg', use: 'Entradilla' },
  { token: 'body', use: 'Texto corrido' },
  { token: 'ui', use: 'Controles y tablas' },
  { token: 'ui-sm', use: 'Metadatos densos' },
  { token: 'label', use: 'Etiquetas de sección' },
];

const meta: Meta = {
  title: 'RELAY/Fundamentos',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Los tokens viven en `tokens/*.json` y un generador los convierte en variables CSS y ' +
          'en el tema de Tailwind. Las paletas por defecto de Tailwind están desactivadas: solo ' +
          'existen como utilidad los colores de RELAY.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Color: Story = {
  render: () => ({
    props: { groups: COLORS },
    template: `
      <div class="p-8">
        <h1 class="text-title-md text-ink">Color</h1>
        <p class="mt-2 max-w-prose text-ui text-text-secondary">
          Relay Acid es el color de marca y de acción; no equivale a «correcto». Los estados
          usan la paleta semántica y siempre van acompañados de texto.
        </p>

        @for (group of groups; track group.group) {
          <section class="mt-8">
            <h2 class="text-label uppercase text-text-muted">{{ group.group }}</h2>
            <ul class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
              @for (token of group.tokens; track token) {
                <li class="overflow-hidden rounded-md border border-border">
                  <div class="h-16" [style.background]="'var(--rly-color-' + token + ')'"></div>
                  <div class="bg-surface px-3 py-2">
                    <p class="text-ui-sm font-medium text-ink">{{ token }}</p>
                  </div>
                </li>
              }
            </ul>
          </section>
        }
      </div>
    `,
  }),
};

export const Tipografia: Story = {
  name: 'Tipografía',
  render: () => ({
    props: { scale: TYPE },
    template: `
      <div class="p-8">
        <h1 class="text-title-md text-ink">Bricolage Grotesque Variable</h1>
        <p class="mt-2 max-w-prose text-ui text-text-secondary">
          Una sola familia para marketing y producto. La escala es fluida entre 390 px y 1440 px,
          así que no hay saltos por breakpoint. Los pesos de interfaz se mantienen entre 500 y 620.
        </p>

        <ul class="mt-8 flex flex-col divide-y divide-border border-y border-border">
          @for (item of scale; track item.token) {
            <li class="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8">
              <span class="w-32 shrink-0 text-ui-sm text-text-muted">{{ item.token }}</span>
              <span class="min-w-0 flex-1 text-ink" [class]="'text-' + item.token">
                Encuentra la campaña adecuada
              </span>
              <span class="w-52 shrink-0 text-ui-sm text-text-secondary">{{ item.use }}</span>
            </li>
          }
        </ul>
      </div>
    `,
  }),
};
