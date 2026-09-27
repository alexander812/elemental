import { useRef } from 'react';

import type { Preview, StoryContext } from '@storybook/react-vite';

import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconBack,
  IconCheck,
  IconClose,
  IconSettings,
  IconViewList,
} from '@elemental/icons';
import type { SupportedIconsMap } from '../src';
import { IconsProvider, ThemeProvider } from '../src';
import { themeGlobalTypes } from './addons/theme-switcher/shared';

const icons: SupportedIconsMap = {
  arrowDown: ({ size }) => <IconArrowUp fontSize={size} />,
  arrowLeft: ({ size }) => <IconArrowLeft fontSize={size} />,
  arrowRight: ({ size }) => <IconArrowRight fontSize={size} />,
  back: ({ size }) => <IconBack fontSize={size} />,
  check: ({ size }) => <IconCheck fontSize={size} />,
  close: ({ size }) => <IconClose fontSize={size} />,
  search: ({ size }) => <IconSettings fontSize={size} />,
  user: ({ size }) => <IconViewList fontSize={size} />,
};

const preview: Preview = {
  decorators: [
    (Story, context: StoryContext) => {
      const ref = useRef(document.body);

      return (
        <ThemeProvider root={ref} themeName={context.globals.theme}>
          <IconsProvider icons={icons}>
            <Story {...context} />
          </IconsProvider>
        </ThemeProvider>
      );
    },
  ],
  globalTypes: {
    theme: themeGlobalTypes,
  },
  initialGlobals: {
    theme: 'dark',
  },
  parameters: {
    backgrounds: {
      options: {
        'surface-canvas': { name: 'surface-canvas', value: 'var(--surface-canvas)' },
        'surface-elevation-1': { name: 'surface-elevation-1', value: 'var(--surface-elevation-1)' },
        'surface-elevation-2': { name: 'surface-elevation-2', value: 'var(--surface-elevation-2)' },
        'surface-elevation-3': { name: 'surface-elevation-3', value: 'var(--surface-elevation-3)' },
      },
    },
    controls: {
      exclude: /^(on[A-Z]|inputRef|innerRef|dataTest)/,
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      sort: 'requiredFirst',
    },
    options: {
      showPanel: false,
    },
  },
  tags: ['autodocs'],
};

export default preview;
