import { useContext } from 'react';

import { ThemeContext } from './ThemeContext';
import type { ThemeDescriptor } from './types';

export function useTheme(): ThemeDescriptor {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('Not found theme in context');
  }

  return theme;
}

export function useThemeUnsafe(): ThemeDescriptor | null {
  return useContext(ThemeContext);
}
