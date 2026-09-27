import { createContext } from 'react';

import type { ThemeDescriptor } from './types';

export const ThemeContext = createContext<ThemeDescriptor | null>(null);
