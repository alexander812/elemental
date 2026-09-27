import { useMemo } from 'react';

import type { ThemeDescriptor } from './types';
import { useTheme } from './useTheme';

export function useThemeToken(name: keyof ThemeDescriptor['tokens']): string {
  const theme = useTheme();

  return useMemo(() => theme.tokens[name], [name, theme.tokens]);
}
