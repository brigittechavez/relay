import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { Checkbox, Radio, Switch, SwitchInput } from '../choice/choice';
import { InputField, SearchInput, TextareaField } from '../input/input';
import { Select, SelectField } from '../select/select';
import { Field } from './field';

const meta: Meta<Field> = {
  title: 'Primitivos/Formulario',
  component: Field,
  decorators: [
    moduleMetadata({
      imports: [
        Field,
        InputField,
        TextareaField,
        SearchInput,
        Select,
        SelectField,
        Checkbox,
        Radio,
        Switch,
        SwitchInput,
        FormsModule,
      ],
    }),
  ],
  args: { label: 'Nombre de la campaña', hint: '', error: null, required: false },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`rly-field` aporta etiqueta, ayuda y error, y enlaza los identificadores con el ' +
          'control por inyección. Los controles son elementos nativos con estilos aplicados, ' +
          'así que `formControlName`, `type`, `autocomplete` y el teclado funcionan sin capas ' +
          'intermedias.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Field>;

export const CampoDeTexto: Story = {
  name: 'Campo de texto',
  render: (args) => ({
    props: args,
    template: `
      <div class="max-w-sm">
        <rly-field [label]="label" [hint]="hint" [error]="error" [required]="required">
          <input rlyInput type="text" placeholder="Landing Pro" />
        </rly-field>
      </div>
    `,
  }),
};

export const Estados: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex max-w-sm flex-col gap-5">
        <rly-field label="Nombre de la campaña" hint="Aparece en el marketplace" required>
          <input rlyInput type="text" value="Landing Pro" />
        </rly-field>

        <rly-field
          label="URL de destino"
          error="Introduce una URL válida que empiece por https://"
        >
          <input rlyInput type="url" value="norte.digital" />
        </rly-field>

        <rly-field label="Identificador" hint="No se puede cambiar tras publicar">
          <input rlyInput type="text" value="landing-pro" readonly />
        </rly-field>

        <rly-field label="Comisión heredada">
          <input rlyInput type="text" value="S/ 300" disabled />
        </rly-field>
      </div>
    `,
  }),
};

export const Desplegable: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="max-w-sm">
        <rly-field label="Ventana de atribución" hint="Tiempo desde el clic hasta la conversión">
          <rly-select>
            <select rlySelect>
              <option>Sesión</option>
              <option>24 horas</option>
              <option>7 días</option>
              <option selected>30 días</option>
              <option>60 días</option>
            </select>
          </rly-select>
        </rly-field>
      </div>
    `,
  }),
};

export const AreaDeTexto: Story = {
  name: 'Área de texto',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="max-w-lg">
        <rly-field
          label="¿Cómo presentarías este servicio a tu audiencia?"
          hint="Entre 60 y 400 caracteres"
          required
        >
          <textarea rlyTextarea rows="4"></textarea>
        </rly-field>
      </div>
    `,
  }),
};

export const Busqueda: Story = {
  name: 'Búsqueda',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="max-w-sm">
        <rly-search-input>
          <input rlyInput withLeadingIcon type="search" placeholder="Buscar campañas" />
        </rly-search-input>
      </div>
    `,
  }),
};

export const Seleccion: Story = {
  name: 'Selección',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-col gap-5">
        <fieldset>
          <legend class="mb-2 text-ui-sm font-medium text-ink">Canales permitidos</legend>
          <div class="flex flex-col gap-2.5">
            <label class="flex items-center gap-2.5 text-ui text-ink">
              <input rlyCheckbox type="checkbox" checked /> Instagram
            </label>
            <label class="flex items-center gap-2.5 text-ui text-ink">
              <input rlyCheckbox type="checkbox" checked /> YouTube
            </label>
            <label class="flex items-center gap-2.5 text-ui text-ink">
              <input rlyCheckbox type="checkbox" /> Newsletter
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-ui-sm font-medium text-ink">Modalidad de acceso</legend>
          <div class="flex flex-col gap-2.5">
            <label class="flex items-center gap-2.5 text-ui text-ink">
              <input rlyRadio type="radio" name="acceso" /> Abierta
            </label>
            <label class="flex items-center gap-2.5 text-ui text-ink">
              <input rlyRadio type="radio" name="acceso" checked /> Selectiva
            </label>
            <label class="flex items-center gap-2.5 text-ui text-ink">
              <input rlyRadio type="radio" name="acceso" /> Premium
            </label>
          </div>
        </fieldset>

        <label class="flex items-center gap-3 text-ui text-ink">
          <rly-switch>
            <input rlySwitch type="checkbox" checked />
          </rly-switch>
          Mostrar mi Relay Score en el perfil público
        </label>
      </div>
    `,
  }),
};
