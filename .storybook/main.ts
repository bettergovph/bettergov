import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  viteFinal: async config => {
    // Ensure Vite can resolve workspace dependencies
    config.resolve = config.resolve || {};
    return config;
  },
};

export default config;
