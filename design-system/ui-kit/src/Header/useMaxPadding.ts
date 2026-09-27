import type { CSSProperties, ReactNode } from 'react';
import { useLayoutEffect, useState } from 'react';

export function useMaxPadding({
  enable,
  startRef,
  endRef,
}: {
  enable: boolean;
  startRef: { current: HTMLElement | null };
  endRef: { current: HTMLElement | null };
}): number {
  const [maxPadding, setMaxPadding] = useState(0);

  useLayoutEffect(() => {
    if (!enable) {
      setMaxPadding(0);
      return;
    }

    const startWidth = startRef.current?.getBoundingClientRect().width ?? 0;
    const endWidth = endRef.current?.getBoundingClientRect().width ?? 0;

    setMaxPadding(Math.max(startWidth, endWidth));
  }, [enable, startRef, endRef]);

  return maxPadding;
}

export type { CSSProperties as HeaderStyleProps };
export type { ReactNode as HeaderNode };
