import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

import { useUnit } from 'effector-react';

import { IconCheckSmall, IconClose, IconMenu, IconPlusBig, IconTasks, IconTrash } from '@elemental/icons';
import { Box, Button, ButtonIcon, Card, Chip, EmptyScreen, Header, Spinner, Stack, Text } from '@elemental/ui-kit';

import type { CardSet } from '../../../lib/types';
import { pushScreen } from '../../navigation/store';
import { fetchSetsFx, reorderSetsFx, setSetActiveFx, $sets, $setsLoading } from '../store';

const ROW_HEIGHT = 64;
const ROW_GAP = 8;
const ROW_STEP = ROW_HEIGHT + ROW_GAP;
const TRASH_WIDTH = 96;
const LONG_PRESS_MS = 420;
const MOVE_SLOP = 10;

type DragState = {
  rowId: string;
  index: number;
  pointerId: number;
  offsetY: number;
  targetSlot: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function getCounts(set: CardSet): { learned: number; notLearned: number } {
  const learned = set.cards.reduce((acc, card) => (card.learned ? acc + 1 : acc), 0);

  return { learned, notLearned: set.cards.length - learned };
}

type SetRowProps = {
  set: CardSet;
  index: number;
  dragging: boolean;
  dragOffsetY: number;
  shift: number;
  reorderActive: boolean;
  open: boolean;
  onReorderStart: (rowId: string, index: number, pointerId: number) => void;
  onReorderMove: (pointerId: number, dy: number) => void;
  onReorderEnd: (rowId: string) => void;
  onDelete: (setId: string) => void;
  onOpen: (setId: string | null) => void;
  onTap: (set: CardSet) => void;
};

function SetRow({
  set,
  index,
  dragging,
  dragOffsetY,
  shift,
  reorderActive,
  open,
  onReorderStart,
  onReorderMove,
  onReorderEnd,
  onDelete,
  onOpen,
  onTap,
}: SetRowProps) {
  const [dx, setDx] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'pending' | 'swipe' | 'reorder'>('idle');
  const [prevOpen, setPrevOpen] = useState(open);
  const startRef = useRef({ x: 0, y: 0, dx: 0, pointerId: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);
  const lastTouchRef = useRef(0);

  const { learned, notLearned } = useMemo(() => getCounts(set), [set]);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setDx(0);
  }

  const handleCardClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    onTap(set);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reorderActive) return;

    if (event.pointerType === 'touch') {
      lastTouchRef.current = Date.now();
    } else if (event.pointerType === 'mouse') {
      if (event.button !== 0) return;
      // compatibility mouse events fired right after a touch gesture
      if (Date.now() - lastTouchRef.current < 700) return;
    }

    clearTimer();
    suppressClickRef.current = false;
    startRef.current = { x: event.clientX, y: event.clientY, dx, pointerId: event.pointerId };
    setPhase('pending');

    const target = event.currentTarget;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      suppressClickRef.current = true;
      setPhase('reorder');
      onReorderStart(set.id, index, event.pointerId);
      target.setPointerCapture?.(event.pointerId);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const { x, y, dx: startDx, pointerId } = startRef.current;

    if (phase === 'pending') {
      const moveX = event.clientX - x;
      const moveY = event.clientY - y;

      if (Math.abs(moveX) > MOVE_SLOP && Math.abs(moveX) > Math.abs(moveY)) {
        clearTimer();
        suppressClickRef.current = true;
        setPhase('swipe');
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } else if (Math.abs(moveY) > MOVE_SLOP) {
        clearTimer();
        suppressClickRef.current = true;
        setPhase('idle');
      }

      return;
    }

    if (phase === 'swipe') {
      setDx(clamp(startDx + event.clientX - x, 0, TRASH_WIDTH));
      return;
    }

    if (phase === 'reorder') {
      onReorderMove(pointerId, event.clientY - y);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const { x, y } = startRef.current;
    const moved = Math.abs(event.clientX - x) > MOVE_SLOP || Math.abs(event.clientY - y) > MOVE_SLOP;

    if (event.pointerType === 'touch') {
      lastTouchRef.current = Date.now();
    }

    if (phase === 'pending') {
      clearTimer();
      setPhase('idle');

      if (!moved) {
        suppressClickRef.current = true;
        onTap(set);
      }
      return;
    }

    if (phase === 'swipe') {
      setPhase('idle');
      const nextDx = dx > TRASH_WIDTH / 2 ? TRASH_WIDTH : 0;
      setDx(nextDx);
      onOpen(nextDx > 0 ? set.id : null);
      return;
    }

    if (phase === 'reorder') {
      setPhase('idle');
      onReorderEnd(set.id);
    }
  };

  const handlePointerCancel = () => {
    clearTimer();
    lastTouchRef.current = Date.now();
    suppressClickRef.current = true;
    setPhase('idle');
    setDx(0);
  };

  const isDragged = dragging;

  const rowStyle: CSSProperties = {
    position: 'relative',
    height: ROW_HEIGHT,
    transform: isDragged ? `translateY(${dragOffsetY}px)` : `translateY(${shift}px)`,
    transition: isDragged ? 'none' : 'transform 160ms ease',
    zIndex: isDragged ? 3 : 1,
  };

  const contentStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    transform: `translateX(${dx}px) scale(${isDragged ? 1.03 : 1})`,
    transition: isDragged ? 'none' : 'transform 160ms ease',
    height: '100%',
    touchAction: isDragged ? 'none' : 'pan-y',
    boxShadow: isDragged ? '0 12px 24px 0 rgb(0, 0, 0, 24%)' : void 0,
  };

  return (
    <div style={rowStyle}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: TRASH_WIDTH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          background: 'var(--negative-bg-default)',
          color: 'var(--negative-over)',
          cursor: 'pointer',
          opacity: clamp(dx / TRASH_WIDTH, 0, 1),
        }}
        onClick={() => onDelete(set.id)}
      >
        <IconTrash fontSize={24} />
      </div>
      <div
        style={contentStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <Card borderRadius="m" color="primary" height="100%" onClick={handleCardClick} padding="m">
          <Stack direction="row" spacing="m" verticalAlign="center" height="100%">
            <Box grow>
              <Text overflow="ellipsis" variant="M / Medium">
                {set.name}
              </Text>
            </Box>
            <Stack direction="row" shrink={0} spacing="xs" verticalAlign="center">
              <Chip
                label={String(learned)}
                size="s"
                startIcon={<IconCheckSmall color="var(--positive-text-and-icons)" fontSize={16} />}
                variant="outlined"
              />
              <Chip
                label={String(notLearned)}
                size="s"
                startIcon={<IconClose color="var(--warning-text-and-icons)" fontSize={16} />}
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Card>
      </div>
    </div>
  );
}

export function SetsView() {
  const sets = useUnit($sets);
  const loading = useUnit($setsLoading);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  useEffect(() => {
    fetchSetsFx();
  }, []);

  const visible = useMemo(
    () =>
      sets
        .filter((set) => set.active)
        .sort((a, b) => a.order - b.order),
    [sets],
  );

  const touchHandlerRef = useRef<(event: TouchEvent) => void>(null);
  const setTouchBlocked = (blocked: boolean) => {
    if (blocked) {
      if (!touchHandlerRef.current) {
        touchHandlerRef.current = (event: TouchEvent) => {
          event.preventDefault();
        };
        document.addEventListener('touchmove', touchHandlerRef.current, { passive: false });
      }
    } else if (touchHandlerRef.current) {
      document.removeEventListener('touchmove', touchHandlerRef.current);
      touchHandlerRef.current = null;
    }
  };

  useEffect(() => {
    return () => setTouchBlocked(false);
  }, []);

  const handleReorderStart = (rowId: string, index: number, pointerId: number) => {
    setTouchBlocked(true);
    setOpenRowId(null);
    setDrag({ rowId, index, pointerId, offsetY: 0, targetSlot: index });
  };

  const handleReorderMove = (pointerId: number, dy: number) => {
    setDrag((state) => {
      if (!state || state.pointerId !== pointerId) return state;

      const targetSlot = clamp(
        Math.round((state.index * ROW_STEP + dy) / ROW_STEP),
        0,
        visible.length - 1,
      );

      return { ...state, offsetY: dy, targetSlot };
    });
  };

  const handleReorderEnd = (rowId: string) => {
    setTouchBlocked(false);

    setDrag((state) => {
      if (state && state.rowId === rowId && state.targetSlot !== state.index) {
        const ids = visible.map((set) => set.id);
        const [moved] = ids.splice(state.index, 1);
        ids.splice(state.targetSlot, 0, moved);
        reorderSetsFx(ids);
      }

      return null;
    });
  };

  const handleDelete = (setId: string) => {
    setOpenRowId(null);
    setSetActiveFx({ setId, active: false });
  };

  const handleTap = (set: CardSet) => {
    if (openRowId) {
      setOpenRowId(null);
      return;
    }

    pushScreen({ name: 'cards', setId: set.id });
  };

  const handleAddNew = () => {
    pushScreen({ name: 'set-create' });
  };

  if (loading) {
    return (
      <Box grow height="100%">
        <Header text="Elemental lang" />
        <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
          <Spinner size="l" />
        </Stack>
      </Box>
    );
  }

  if (visible.length === 0) {
    return (
      <Box grow height="100%">
        <Header text="Elemental lang" />
        <EmptyScreen
          action={
            <Button startIcon={<IconPlusBig fontSize={16} />} onClick={handleAddNew}>
              Добавить новый
            </Button>
          }
          fullHeight
          icon={<IconTasks fontSize={24} />}
          text="Пока нет ни одного набора карточек"
        />
      </Box>
    );
  }

  return (
    <Box grow height="100%">
      <Header
        endToolbar={
          <ButtonIcon
            ariaLabel="Меню"
            icon={<IconMenu fontSize={24} />}
            variant="flat"
            onClick={() => pushScreen({ name: 'menu' })}
          />
        }
        text="Elemental lang"
      />
      <Box grow padding="m">
        <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
          {visible.map((set, index) => {
            const isDragged = drag?.rowId === set.id;
            const shift = (() => {
              if (!drag || isDragged) return 0;
              if (index > drag.index && index <= drag.targetSlot) return -ROW_STEP;
              if (index < drag.index && index >= drag.targetSlot) return ROW_STEP;
              return 0;
            })();

            return (
              <SetRow
                key={set.id}
                dragOffsetY={drag?.offsetY ?? 0}
                dragging={isDragged}
                index={index}
                open={openRowId === set.id}
                reorderActive={!!drag}
                set={set}
                shift={shift}
                onDelete={handleDelete}
                onOpen={setOpenRowId}
                onReorderEnd={handleReorderEnd}
                onReorderMove={handleReorderMove}
                onReorderStart={handleReorderStart}
                onTap={handleTap}
              />
            );
          })}
        </div>
      </Box>
      <Box padding="m">
        <Button fullWidth startIcon={<IconPlusBig fontSize={16} />} variant="secondary" onClick={handleAddNew}>
          Добавить новый
        </Button>
      </Box>
    </Box>
  );
}
