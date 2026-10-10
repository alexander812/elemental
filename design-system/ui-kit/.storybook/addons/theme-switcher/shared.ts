import type { GlobalTypes } from 'storybook/internal/types';

export const themeGlobalTypes: GlobalTypes[string] = {
  description: 'Theme switcher',
  toolbar: {
    icon: 'paintbrush',
    items: [
      { value: 'dark', title: 'Dark', right: 'dark' },
      { value: 'light', title: 'Light', right: 'light' },
      { value: 'terracotta', title: 'Terracotta', right: 'terracotta' },
      { value: 'midnight', title: 'Midnight', right: 'midnight' },
      { value: 'stone', title: 'Stone', right: 'stone' },
      { value: 'amethyst', title: 'Amethyst', right: 'amethyst' },
    ],
  },
};
