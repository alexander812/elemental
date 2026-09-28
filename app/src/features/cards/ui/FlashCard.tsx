import { useMemo } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

import { IconCheck, IconRefresh, IconSound, IconTrash } from '@elemental/icons';
import { Stack, Text } from '@elemental/ui-kit';

import { canSpeak } from '../../../transport/speech';

import classes from './FlashCard.module.pcss';

export type Leaving = {
  id: string;
  x: number;
  y: number;
  rotate: number;
  action: 'learned' | 'later' | 'delete';
};

export type DragPos = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  pointerId: number;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export type FlashCardProps = {
  backText: string;
  depth: number;
  frontText: string;
  flipped: boolean;
  leaving: Leaving | null;
  drag: DragPos | null;
  interactive: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
  onFlip: () => void;
  onSpeakBack: () => void;
  onSpeakFront: () => void;
};

export function FlashCard({
  backText,
  depth,
  frontText,
  flipped,
  leaving,
  drag,
  interactive,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onFlip,
  onSpeakBack,
  onSpeakFront,
}: FlashCardProps) {
  const isTop = depth === 0;

  const badgeOpacity = (value: number) => clamp01(value);

  const baseTransform = useMemo(() => {
    if (leaving) {
      return `translate(${leaving.x}px, ${leaving.y}px) rotate(${leaving.rotate}deg)`;
    }

    if (drag && isTop) {
      const rotate = drag.x / 24;
      return `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg)`;
    }

    return `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`;
  }, [leaving, drag, isTop, depth]);

  const wrapperStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: baseTransform,
    transition: drag || leaving ? 'none' : 'transform 200ms ease',
    opacity: leaving ? 0 : 1,
    zIndex: 100 - depth,
    pointerEvents: interactive && !leaving ? 'auto' : 'none',
    touchAction: 'none',
  };

  const flipStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 400ms ease',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const faceStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 20,
    boxShadow: '0 12px 32px 0 rgb(0, 0, 0, 24%)',
    overflow: 'hidden',
  };

  const leftBadgeOpacity = drag && isTop ? badgeOpacity(-drag.x / 80) : 0;
  const rightBadgeOpacity = drag && isTop ? badgeOpacity(drag.x / 80) : 0;
  const upBadgeOpacity = drag && isTop ? badgeOpacity(-drag.y / 80) : 0;

  const badgeStyle = (side: 'left' | 'right' | 'up'): CSSProperties => ({
    position: 'absolute',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    border: '2px solid currentColor',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 700,
    transition: 'opacity 80ms linear',
    ...(side === 'left'
      ? { top: 24, left: 24, transform: 'rotate(-12deg)', color: 'var(--positive-text-and-icons)', opacity: leftBadgeOpacity }
      : side === 'right'
        ? { top: 24, right: 24, transform: 'rotate(12deg)', color: 'var(--warning-text-and-icons)', opacity: rightBadgeOpacity }
        : { bottom: 24, left: '50%', transform: 'translateX(-50%)', color: 'var(--negative-text-and-icons)', opacity: upBadgeOpacity }),
  });

  const showSound = isTop && !leaving && interactive && canSpeak();

  const soundButton = (onSpeak: () => void) => (
    <button
      aria-label="Озвучить"
      className={classes.soundButton}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSpeak();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <IconSound fontSize={24} />
    </button>
  );

  return (
    <div
      style={wrapperStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div style={{ width: '100%', height: '100%', perspective: 1200 }} onClick={isTop ? onFlip : undefined}>
        <div style={flipStyle}>
          <div
            style={{
              ...faceStyle,
              background: 'var(--accent-bg-default)',
              color: 'var(--accent-over)',
              transform: 'rotateY(0deg)',
            }}
          >
            <Stack spacing="l" horizontalAlign="center" verticalAlign="center">
              <Text align="center" variant="XL / Medium">
                {frontText}
              </Text>
              <Text align="center" color="inherit" opacity={0.7} variant="XS / Medium">
                нажмите, чтобы перевернуть
              </Text>
            </Stack>
            {showSound ? soundButton(onSpeakFront) : null}
          </div>
          <div
            style={{
              ...faceStyle,
              background: 'var(--surface-elevation-1)',
              color: 'var(--contrast-primary)',
              border: '1px solid var(--contrast-quaternary)',
              transform: 'rotateY(180deg)',
            }}
          >
            <Stack spacing="s" horizontalAlign="center" verticalAlign="center">
              <Text align="center" color="contrast-secondary" variant="XS / Medium">
                {frontText}
              </Text>
              <Text align="center" variant="L / Medium">
                {backText}
              </Text>
            </Stack>
            {showSound ? soundButton(onSpeakBack) : null}
          </div>
          {isTop && !leaving && (
            <>
              <div style={badgeStyle('left')}>
                <IconCheck fontSize={20} /> выучено
              </div>
              <div style={badgeStyle('right')}>
                <IconRefresh fontSize={20} /> позже
              </div>
              <div style={badgeStyle('up')}>
                <IconTrash fontSize={20} /> удалить
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
