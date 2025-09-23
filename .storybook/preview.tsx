import type { Preview } from '@storybook/react';
import '../src/index.css'; // Import global styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#333333',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
      ],
    },
    layout: 'centered',
  },
  decorators: [Story => <Story />],
};

export default preview;
