import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: [
    {
      directory: '../src',
      files: '**/*.stories.@(tsx|ts)',
    },
  ],
};

export default config;
