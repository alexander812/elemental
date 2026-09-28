import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { IconsProvider, ThemeProvider } from '@elemental/ui-kit';
import { useUnit } from 'effector-react';

import { fetchLanguagesFx } from './features/languages/store';
import { fetchSettingsFx, $theme } from './features/theme/store';
import { icons } from './icons';

export function ThemeRoot({ children }: { children: ReactNode }) {
  const theme = useUnit($theme);

  useEffect(() => {
    fetchSettingsFx();
    fetchLanguagesFx();
  }, []);

  return (
    <ThemeProvider root={document.body} themeName={theme}>
      <IconsProvider icons={icons}>{children}</IconsProvider>
    </ThemeProvider>
  );
}
