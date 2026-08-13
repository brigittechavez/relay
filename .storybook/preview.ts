import type { Preview } from '@storybook/angular-vite';
import '../src/styles.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: 'todo' },
    backgrounds: {
      options: {
        canvas: { name: 'Canvas', value: '#F7F8F4' },
        surface: { name: 'Surface', value: '#FFFFFF' },
        ink: { name: 'Ink', value: '#101210' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'canvas' },
  },
};

export default preview;
