import type { RefObject } from 'react';
import { useEffect } from 'react';

import { useCallbackRef } from './useCallbackRef';

type UseOutsideClickProps = {
  enabled?: boolean;
  handler?: (event: PointerEvent) => void;
  ref: HTMLElement | RefObject<HTMLElement | null> | null;
};

export const useOutsideClick = ({ enabled, handler, ref }: UseOutsideClickProps): void => {
  const savedHandler = useCallbackRef(handler);

  useEffect(() => {
    if (!enabled) return;

    const element = ref && 'current' in ref ? ref.current : ref;

    if (!element) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (target && !element.contains(target)) {
        savedHandler(event);
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [enabled, ref, savedHandler]);
};
