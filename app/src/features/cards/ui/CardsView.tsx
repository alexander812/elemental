import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import { useUnit } from 'effector-react';

import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCheck,
  IconCheckSmall,
  IconClose,
  IconEducation,
  IconMoreHorizontal,
  IconPlusBig,
  IconRestore,
  IconTrash,
} from '@elemental/icons';
import {
  Box,
  Button,
  ButtonIcon,
  EmptyScreen,
  Header,
  Menu,
  Spinner,
  Stack,
  Text,
} from '@elemental/ui-kit';

import { getCardText } from '../../../lib/cards';
import type { Card as CardModel } from '../../../lib/types';
import { goToRoot, popScreen, pushScreen } from '../../navigation/store';
import {
  deleteCardFx,
  deleteCardsFx,
  fetchSetsFx,
  setCardLearnedFx,
  $sets,
  $setsLoading,
} from '../../sets/store';
import { $originalLang, $translationLang } from '../../theme/store';
import { FlashCard } from './FlashCard';
import type { DragPos, Leaving } from './FlashCard';

const SWIPE_THRESHOLD = 110;
const UP_THRESHOLD = 110;
const LEAVE_MS = 260;
const DECK_DEPTH = 3;

type Filter = 'learned' | 'unlearned';

export function CardsView({ setId }: { setId: string }) {
  const sets = useUnit($sets);
  const setsLoading = useUnit($setsLoading);
  const originalLang = useUnit($originalLang);
  const translationLang = useUnit($translationLang);

  const [filter, setFilter] = useState<Filter>('unlearned');
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(() => new Set());
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [drag, setDrag] = useState<DragPos | null>(null);
  const [leaving, setLeaving] = useState<Leaving | null>(null);

  const dragRef = useRef<DragPos | null>(null);
  const leavingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const lastTouchRef = useRef(0);

  useEffect(() => {
    fetchSetsFx();
  }, []);

  useEffect(() => {
    return () => {
      if (leavingTimerRef.current) clearTimeout(leavingTimerRef.current);
    };
  }, []);

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId]);
  const byId = useMemo(() => {
    const map = new Map<string, CardModel>();
    set?.cards.forEach((card) => map.set(card.id, card));
    return map;
  }, [set]);

  const isLearnedFilter = filter === 'learned';

  const displayedQueue = useMemo(
    () =>
      set
        ? set.cards
            .filter(
              (card) => card.learned === isLearnedFilter && !card.deleted && !excluded.has(card.id),
            )
            .map((card) => card.id)
        : [],
    [set, isLearnedFilter, excluded],
  );

  const topCard = displayedQueue[0] ? byId.get(displayedQueue[0]) : undefined;

  const learnedCount = useMemo(
    () =>
      set
        ? set.cards.reduce((acc, card) => (card.learned && !card.deleted ? acc + 1 : acc), 0)
        : 0,
    [set],
  );

  const unlearnedCount = useMemo(
    () => (set ? set.cards.filter((card) => !card.learned && !card.deleted).length : 0),
    [set],
  );

  const allSwiped = displayedQueue.length === 0;
  const noCards = set ? set.cards.every((card) => card.deleted) : true;

  const commitLeave = (action: Leaving['action'], cardId: string) => {
    setLeaving(null);

    if (action === 'delete') {
      deleteCardFx({ setId, cardId });
      return;
    }

    if (action === 'later' && isLearnedFilter) {
      setCardLearnedFx({ setId, cardId, learned: false });
    }

    if (action === 'learned' && !isLearnedFilter) {
      setCardLearnedFx({ setId, cardId, learned: true });
    }

    const staysInFilter = isLearnedFilter ? action === 'learned' : action === 'later';

    if (staysInFilter) {
      setExcluded((prev) => {
        const next = new Set(prev);
        next.add(cardId);
        return next;
      });
    }
  };

  const startLeave = (action: Leaving['action'], dragPos: DragPos) => {
    if (!topCard) return;

    const leave: Leaving = {
      id: topCard.id,
      action,
      x: action === 'learned' ? -500 : action === 'later' ? 500 : dragPos.x * 1.2,
      y: action === 'delete' ? -700 : dragPos.y * 0.9,
      rotate: dragPos.x / 24,
    };

    setLeaving(leave);
    setDrag(null);
    dragRef.current = null;
    setFlipped((prev) => {
      const next = { ...prev };
      delete next[topCard.id];
      return next;
    });

    leavingTimerRef.current = setTimeout(() => {
      commitLeave(action, topCard.id);
    }, LEAVE_MS);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (leaving || !topCard || displayedQueue.length === 0) return;

    if (event.pointerType === 'touch') {
      lastTouchRef.current = Date.now();
    } else if (event.pointerType === 'mouse') {
      if (event.button !== 0) return;
      // compatibility mouse events fired right after a touch gesture
      if (Date.now() - lastTouchRef.current < 700) return;
    }

    const next: DragPos = {
      x: 0,
      y: 0,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
    };

    dragRef.current = next;
    setDrag(next);
    movedRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    const next = {
      ...state,
      x: event.clientX - state.startX,
      y: event.clientY - state.startY,
    };

    if (Math.abs(next.x) > 8 || Math.abs(next.y) > 8) {
      movedRef.current = true;
    }

    dragRef.current = next;
    setDrag(next);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;

    if (event.pointerType === 'touch') {
      lastTouchRef.current = Date.now();
    }

    if (!state || state.pointerId !== event.pointerId) return;

    dragRef.current = null;

    const horizontal = Math.abs(state.x) > Math.abs(state.y);

    if (state.y < -UP_THRESHOLD && !horizontal) {
      startLeave('delete', state);
      return;
    }

    if (state.x > SWIPE_THRESHOLD && horizontal) {
      startLeave('later', state);
      return;
    }

    if (state.x < -SWIPE_THRESHOLD && horizontal) {
      startLeave('learned', state);
      return;
    }

    setDrag(null);
  };

  const handlePointerCancel = () => {
    lastTouchRef.current = Date.now();
    dragRef.current = null;
    setDrag(null);
  };

  const handleFlip = () => {
    if (!topCard || leaving || movedRef.current) return;
    setFlipped((prev) => ({ ...prev, [topCard.id]: !prev[topCard.id] }));
  };

  const handleDeleteAll = () => {
    deleteCardsFx({ setId, learned: isLearnedFilter });
    setExcluded(new Set());
  };

  const handleRestoreDeleted = () => {
    pushScreen({ name: 'cards-restore', setId });
  };

  const handleRestart = () => {
    setFlipped({});
    setExcluded(new Set());
  };

  const handleNextSet = () => {
    if (!set) {
      goToRoot();
      return;
    }

    const next = sets
      .filter((item) => item.active && item.id !== set.id && item.order > set.order)
      .sort((a, b) => a.order - b.order)[0];

    if (next) {
      pushScreen({ name: 'cards', setId: next.id });
      return;
    }

    goToRoot();
  };

  const handleAddWord = () => {
    pushScreen({ name: 'card-create', setId });
  };

  if (!set) {
    return (
      <Box grow height="100%">
        <Header back text="Набор карточек" onBackClick={() => popScreen()} />
        {setsLoading ? (
          <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
            <Spinner size="l" />
          </Stack>
        ) : (
          <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Набор не найден" />
        )}
      </Box>
    );
  }

  const deckCards = displayedQueue.slice(0, DECK_DEPTH);

  const finishedUnlearned = !isLearnedFilter && allSwiped && unlearnedCount === 0;
  const finishedWithRestart = !isLearnedFilter && allSwiped && unlearnedCount > 0;

  return (
    <Box grow height="100%">
      <Header
        back
        endToolbar={
          <Menu.Root open={menuOpen} onToggle={setMenuOpen}>
            <Menu.Trigger>
              <ButtonIcon ariaLabel="Меню" icon={<IconMoreHorizontal fontSize={24} />} variant="flat" />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item
                icon={<IconTrash fontSize={16} />}
                label="Удалить все карточки"
                onClick={handleDeleteAll}
              />
              <Menu.Item
                icon={<IconRestore fontSize={16} />}
                label="Восстановить удалённые"
                onClick={handleRestoreDeleted}
              />
            </Menu.Content>
          </Menu.Root>
        }
        text={set.name}
        onBackClick={() => popScreen()}
      />

      <Box grow padding="m">
        <Stack spacing="l" height="100%">
          <Stack direction="row" horizontalAlign="space-between">
            <Button
              checked={isLearnedFilter}
              color="neutral"
              startIcon={<IconCheckSmall fontSize={16} />}
              variant="secondary"
              onClick={() => setFilter('learned')}
            >
              {learnedCount}
            </Button>
            <Button
              checked={!isLearnedFilter}
              color="neutral"
              startIcon={<IconClose fontSize={16} />}
              variant="secondary"
              onClick={() => setFilter('unlearned')}
            >
              {unlearnedCount}
            </Button>
          </Stack>

          {noCards ? (
            <EmptyScreen
              action={
                <Button startIcon={<IconPlusBig fontSize={16} />} onClick={handleAddWord}>
                  Добавить слово
                </Button>
              }
              fullHeight
              icon={<IconEducation fontSize={24} />}
              text="Пока в наборе нет карточек"
            />
          ) : finishedWithRestart ? (
            <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
              <Text align="center" color="contrast-secondary" variant="S / Medium">
                Вы посмотрели все карточки
              </Text>
              <Button onClick={handleRestart}>Начать сначала</Button>
              <Button variant="secondary" onClick={handleNextSet}>
                Перейти к следующему набору
              </Button>
            </Stack>
          ) : finishedUnlearned ? (
            <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
              <IconCheck color="var(--positive-text-and-icons)" fontSize={32} />
              <Text align="center" color="contrast-secondary" variant="S / Medium">
                Все карточки выучены
              </Text>
              <Button variant="secondary" onClick={handleNextSet}>
                Перейти к следующему набору
              </Button>
            </Stack>
          ) : allSwiped && isLearnedFilter ? (
            <EmptyScreen fullHeight icon={<IconCheckSmall fontSize={24} />} text="Нет выученных карточек" />
          ) : (
            <Box grow position="relative" minHeight={280}>
              {deckCards.map((id, index) => {
                const card = byId.get(id);
                if (!card) return null;

                return (
                  <FlashCard
                    key={id}
                    backText={getCardText(card, translationLang).text}
                    depth={index}
                    drag={index === 0 ? drag : null}
                    flipped={!!flipped[id]}
                    frontText={getCardText(card, originalLang).text}
                    interactive={index === 0}
                    leaving={leaving?.id === id ? leaving : null}
                    onFlip={handleFlip}
                    onPointerCancel={handlePointerCancel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />
                );
              })}
            </Box>
          )}

          {!noCards && (
            <Stack direction="row" horizontalAlign="center" spacing="m" verticalAlign="center">
              <Stack direction="row" spacing="xs" verticalAlign="center">
                <IconArrowLeft color="var(--positive-text-and-icons)" fontSize={16} />
                <Text color="contrast-tertiary" variant="XS / Medium">
                  выучено
                </Text>
              </Stack>
              <Stack direction="row" spacing="xs" verticalAlign="center">
                <IconArrowRight color="var(--warning-text-and-icons)" fontSize={16} />
                <Text color="contrast-tertiary" variant="XS / Medium">
                  позже
                </Text>
              </Stack>
              <Stack direction="row" spacing="xs" verticalAlign="center">
                <IconArrowUp color="var(--negative-text-and-icons)" fontSize={16} />
                <Text color="contrast-tertiary" variant="XS / Medium">
                  удалить
                </Text>
              </Stack>
            </Stack>
          )}

          {!noCards && (
            <Button fullWidth startIcon={<IconPlusBig fontSize={16} />} variant="secondary" onClick={handleAddWord}>
              Добавить слово
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
