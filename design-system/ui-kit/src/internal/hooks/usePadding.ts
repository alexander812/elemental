import { useMemo } from 'react';

import type { Padding } from '../types';
import { calculateSize } from '../utils';

const paddingCache = new Map<Padding<string>, string | undefined>();

export const usePadding = <P extends string>(padding: Padding<P> | undefined): string | undefined => {
  return useMemo(() => {
    if (padding === void 0) return calculateSize(padding);

    const fromCache = paddingCache.get(padding);

    if (fromCache) return fromCache;

    const calculatedPadding = padding
      .split(' ')
      .map((item: string) => calculateSize(item))
      .join(' ');

    paddingCache.set(padding, calculatedPadding);

    return calculatedPadding;
  }, [padding]);
};
