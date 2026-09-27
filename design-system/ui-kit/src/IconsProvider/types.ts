import type { FC } from 'react';

export type SupportedIcons =
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'back'
  | 'check'
  | 'close'
  | 'search'
  | 'user';

export type SupportedIconsMap = Record<SupportedIcons, FC<{ size: number }>>;
