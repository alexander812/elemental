import type { CSSProperties, PointerEvent as ReactPointerEvent, PropsWithChildren } from 'react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { useBottomSheetContext } from './context';
import { registerBottomSheet } from './stack';

import classes from './index.module.pcss';

type BottomSheetProps = PropsWithChildren<{
  canClose?: boolean;
  dataTest?: string;
  onClosed?: () => void;
  opened: boolean;
}>;

const animationDuration = 250;
const closeDistance = 96;
const closeVelocity = 0.5;

const BottomSheet = ({
  canClose = true,
  children,
  dataTest = 'BottomSheet',
  onClosed,
  opened,
}: BottomSheetProps) => {
  const { host } = useBottomSheetContext();

  const [mounted, setMounted] = useState(opened);
  const [entered, setEntered] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  const dragRef = useRef<{ startY: number; startedAt: number } | null>(null);

  useEffect(() => {
    if (!opened) {
      setEntered(false);
      setDragOffset(null);

      return;
    }

    setMounted(true);

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [opened]);

  useEffect(() => {
    if (!mounted || opened) return;

    const timer = setTimeout(() => setMounted(false), animationDuration);

    return () => clearTimeout(timer);
  }, [mounted, opened]);

  useEffect(() => {
    if (!opened || !canClose || !onClosed) return;

    return registerBottomSheet({ close: onClosed });
  }, [opened, canClose, onClosed]);

  useEffect(() => {
    if (!opened || !canClose || !onClosed) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClosed();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [opened, canClose, onClosed]);

  const handleOverlayClick = useCallback(() => {
    if (canClose) onClosed?.();
  }, [canClose, onClosed]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!canClose || !onClosed) return;

      dragRef.current = { startY: event.clientY, startedAt: performance.now() };
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragOffset(0);
    },
    [canClose, onClosed],
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag) return;

    setDragOffset(Math.max(0, event.clientY - drag.startY));
  }, []);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;

      if (!drag) return;

      dragRef.current = null;

      const offset = Math.max(0, event.clientY - drag.startY);
      const velocity = offset / Math.max(performance.now() - drag.startedAt, 1);

      setDragOffset(null);

      if (offset > closeDistance || velocity > closeVelocity) {
        onClosed?.();
      }
    },
    [onClosed],
  );

  const handlePointerCancel = useCallback(() => {
    dragRef.current = null;
    setDragOffset(null);
  }, []);

  if (!host || !mounted) return null;

  const sheetStyle: CSSProperties = {
    transform:
      dragOffset === null
        ? entered
          ? 'translateY(0)'
          : 'translateY(100%)'
        : `translateY(${dragOffset}px)`,
    transition: dragOffset === null ? undefined : 'none',
  };

  return createPortal(
    <Fragment>
      <div
        className={classNames(classes.overlay, entered && classes.overlayOpened)}
        data-test={`${dataTest}-overlay`}
        onClick={handleOverlayClick}
      />
      <div
        className={classNames(classes.sheet, entered && classes.sheetOpened)}
        data-test={dataTest}
        style={sheetStyle}
      >
        {canClose ? (
          <div
            className={classes.header}
            onPointerCancel={handlePointerCancel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className={classes.grabber} />
          </div>
        ) : null}
        <div className={classes.content}>{children}</div>
      </div>
    </Fragment>,
    host,
  );
};

export { BottomSheet };
export type { BottomSheetProps };
export { BottomSheetProvider, useBottomSheetContext } from './context';
export { closeTopBottomSheet } from './stack';
