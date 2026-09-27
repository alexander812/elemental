import { createContext, useContext } from 'react';

import type { SupportedIconsMap } from './types';

export const IconsContext = createContext<SupportedIconsMap | null>(null);

export function useIconsMap(): SupportedIconsMap | null {
  return useContext(IconsContext);
}
