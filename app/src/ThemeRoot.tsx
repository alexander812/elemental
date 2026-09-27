import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { IconsProvider, ThemeProvider } from '@elemental/ui-kit';
import { useUnit } from 'effector-react';

import { fetchSettingsFx, $theme } from './features/theme/store';
import { icons } from './icons';

export function ThemeRoot({ children }: { children: ReactNode }) {
  const theme = useUnit($theme);

  useEffect(() => {
    fetchSettingsFx();
  }, []);

  return (
    <ThemeProvider root={document.body} themeName={theme}>
      <IconsProvider icons={icons}>{children}</IconsProvider>
    </ThemeProvider>
  );
}
