import type { FC, PropsWithChildren, RefObject } from 'react';
import { useEffect, useMemo } from 'react';

import { parsePxToRem } from '../internal/utils';
import type { Tokens } from '../tokens';
import colors from '../tokens/colors.json';
import corners from '../tokens/corners.json';
import fonts from '../tokens/fonts.json';

import { ThemeContext } from './ThemeContext';
import type { ThemeDescriptor, ThemeDir, ThemeName } from './types';
import { useThemeUnsafe } from './useTheme';
import { isColorLight } from './utils';

type ThemeProviderProps = PropsWithChildren<{
  dir?: ThemeDir | undefined;
  focusVisibleEnabled?: boolean | undefined;
  overrides?: Partial<Tokens> | undefined;
  root: HTMLElement | RefObject<HTMLElement | null> | null;
  themeName?: ThemeName | undefined;
}>;

const ThemeProvider: FC<ThemeProviderProps> = function ThemeProvider({
  children,
  dir: dirProp,
  focusVisibleEnabled = true,
  overrides,
  root,
  themeName,
}) {
  const upperTheme = useThemeUnsafe();
  const container = root ? ('current' in root ? root.current : root) : null;

  const dir = useMemo(() => dirProp ?? upperTheme?.dir ?? 'ltr', [dirProp, upperTheme]);

  const currentTheme = useMemo(() => {
    return themeName ?? 'dark';
  }, [themeName]);

  const themeDescriptor = useMemo<ThemeDescriptor>(() => {
    const parsedCorners = Object.entries(corners).reduce((res, [key, value]) => {
      res[key as keyof typeof corners] = parsePxToRem(value) as string;

      return res;
    }, corners);

    const normalizedTokens: ThemeDescriptor['tokens'] = {
      ...colors[currentTheme],
      ...parsedCorners,
      ...fonts,
      ...overrides,
    };

    return {
      dir,
      focusVisibleEnabled,
      isLight: isColorLight(normalizedTokens['surface-canvas']),
      isRtl: dir === 'rtl',
      root: container,
      themeName: currentTheme,
      tokens: normalizedTokens,
    };
  }, [currentTheme, overrides, dir, container, focusVisibleEnabled]);

  useEffect(() => {
    if (container) {
      container.setAttribute('dir', themeDescriptor.dir);
      container.setAttribute('data-theme', `${themeName}`);

      for (const key in themeDescriptor.tokens) {
        container.style.setProperty(`--${key}`, (themeDescriptor.tokens as Record<string, string>)[key]);
      }

      return () => {
        container.setAttribute('dir', '');
        container.setAttribute('data-theme', '');

        for (const key in themeDescriptor.tokens) {
          container.style.removeProperty(`--${key}`);
        }
      };
    }
  }, [container, themeName, themeDescriptor]);

  useEffect(() => {
    if (container) {
      container.setAttribute('data-focus-visible', focusVisibleEnabled ? 'true' : 'false');
    }

    return () => {
      if (container) {
        container.setAttribute('data-focus-visible', 'false');
      }
    };
  }, [container, focusVisibleEnabled]);

  return <ThemeContext.Provider value={themeDescriptor}>{children}</ThemeContext.Provider>;
};

ThemeProvider.displayName = 'ThemeProvider';

export { ThemeProvider };
