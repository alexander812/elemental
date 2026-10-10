import type { Tokens } from '../tokens';

export type ThemeDir = 'ltr' | 'rtl';

export type ThemeName = 'dark' | 'light' | 'terracotta';

export type ThemeDescriptor = {
  dir: ThemeDir;
  isLight: boolean;
  isRtl: boolean;
  root: HTMLElement | null;
  themeName?: ThemeName;
  tokens: Tokens;
};
