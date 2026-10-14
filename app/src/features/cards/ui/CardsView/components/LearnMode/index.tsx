import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { IconEducation } from '@elemental/icons'
import { Box, Button, Header, Stack } from '@elemental/ui-kit'

import { getCardText } from '../../../../../../lib/cards'
import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../../../../lib/languages'
import type { Card as CardModel } from '../../../../../../lib/types'
import { ConfirmSheet } from '../../../../../../shared/ui/ConfirmSheet'
import { $asrProgress } from '../../../../../../shared/ui/RecognitionSheet'
import { vibrateLong, vibrateShort } from '../../../../../../transport/haptics'
import { $languages } from '../../../../../languages/store'
import { popScreen, pushScreen } from '../../../../../navigation/store'
import { $onboardingOpened } from '../../../../../onboarding/store'
import { useShakeHint } from '../../../../../onboarding/ui/useShakeHint'
import {
  deleteCardFx,
  deleteCardsFx,
  deleteSetFx,
  resetSetFx,
  setCardLearnedFx,
  $courseLangByLesson,
  $sets,
} from '../../../../../sets/store'
import { SetMenu } from '../../../../../sets/ui/SetMenu'
import { $userLang, $voiceCheckEnabled, $writeCheckEnabled } from '../../../../../theme/store'
import { cancelRecognizeFx, recognizeFx } from '../../../../store'
import { DECK_DEPTH, findNextSet, LEAVE_MS, nextSetScreen } from '../../helpers'
import { FlashCard } from '../FlashCard'
import type { DragPos, Leaving } from '../FlashCard'
import { TestMode } from '../TestMode'
import { FilterBar } from './components/FilterBar'
import type { Filter } from './components/FilterBar'
import { LearnFinish } from './components/LearnFinish'
import type { LearnFinishVariant } from './components/LearnFinish'
import { SwipeHints } from './components/SwipeHints'
import { useLearnChecks } from './useLearnChecks'

const SWIPE_THRESHOLD = 110
const UP_THRESHOLD = 110

const now = (): number => Date.now()

export function LearnMode({ setId }: { setId: string }) {
  const sets = useUnit($sets)
  const asrProgress = useUnit($asrProgress)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const voiceCheckEnabled = useUnit($voiceCheckEnabled)
  const writeCheckEnabled = useUnit($writeCheckEnabled)
  const deleteSetPending = useUnit(deleteSetFx.pending)
  const resetPending = useUnit(resetSetFx.pending)
  const onboardingOpened = useUnit($onboardingOpened)

  const [filter, setFilter] = useState<Filter>('unlearned')
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(() => new Set())
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [drag, setDrag] = useState<DragPos | null>(null)
  const [leaving, setLeaving] = useState<Leaving | null>(null)
  const [testMode, setTestMode] = useState(false)
  const [sweptAll, setSweptAll] = useState(false)

  const dragRef = useRef<DragPos | null>(null)
  const leavingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoLearnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topCardIdRef = useRef<string | null>(null)
  const prevQueueLengthRef = useRef(0)
  const movedRef = useRef(false)
  const lastTouchRef = useRef(0)

  useEffect(() => {
    return () => {
      if (leavingTimerRef.current) clearTimeout(leavingTimerRef.current)
      if (autoLearnTimerRef.current) clearTimeout(autoLearnTimerRef.current)

      if (recognizeFx.pending.getState()) cancelRecognizeFx()
    }
  }, [])

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId])
  const courseLang = (set ? courseLangByLesson.get(set.lessonId) : undefined) ?? DEFAULT_COURSE_LANG
  const byId = useMemo(() => {
    const map = new Map<string, CardModel>()
    set?.cards.forEach((card) => map.set(card.id, card))
    return map
  }, [set])

  const isLearnedFilter = filter === 'learned'

  const displayedQueue = useMemo(
    () =>
      set
        ? set.cards
            .filter(
              (card) => card.learned === isLearnedFilter && !card.deleted && !excluded.has(card.id)
            )
            .map((card) => card.id)
        : [],
    [set, isLearnedFilter, excluded]
  )

  const topCard = displayedQueue[0] ? byId.get(displayedQueue[0]) : undefined

  useEffect(() => {
    topCardIdRef.current = topCard?.id ?? null
  }, [topCard?.id])

  useEffect(() => {
    const previousLength = prevQueueLengthRef.current

    prevQueueLengthRef.current = displayedQueue.length

    if (previousLength > 0 && displayedQueue.length === 0) setSweptAll(true)
  }, [displayedQueue.length])

  const learnedCount = useMemo(
    () =>
      set ? set.cards.reduce((acc, card) => (card.learned && !card.deleted ? acc + 1 : acc), 0) : 0,
    [set]
  )

  const unlearnedCount = useMemo(
    () => (set ? set.cards.filter((card) => !card.learned && !card.deleted).length : 0),
    [set]
  )

  const activeDeck = useMemo(() => (set ? set.cards.filter((card) => !card.deleted) : []), [set])

  const counter = useMemo(() => {
    if (!topCard) return undefined

    const index = activeDeck.findIndex((card) => card.id === topCard.id)

    return index === -1 ? undefined : { current: index + 1, total: activeDeck.length }
  }, [activeDeck, topCard])

  const allSwiped = displayedQueue.length === 0
  const noCards = set ? set.cards.every((card) => card.deleted) : true

  const testHintShake = useShakeHint(
    'test-button',
    !onboardingOpened && sweptAll && !testMode && !noCards && !confirmDelete && !isLearnedFilter
  )

  const commitLeave = (action: Leaving['action'], cardId: string) => {
    setLeaving(null)
    clearCheckStatus()

    if (action === 'delete') {
      deleteCardFx({ setId, cardId })
      return
    }

    if (action === 'later' && isLearnedFilter) {
      setCardLearnedFx({ setId, cardId, learned: false })
    }

    if (action === 'learned' && !isLearnedFilter) {
      setCardLearnedFx({ setId, cardId, learned: true })
    }

    const staysInFilter = isLearnedFilter ? action === 'learned' : action === 'later'

    if (staysInFilter) {
      setExcluded((prev) => {
        const next = new Set(prev)
        next.add(cardId)
        return next
      })
    }
  }

  const cancelAutoLearn = () => {
    if (!autoLearnTimerRef.current) return

    clearTimeout(autoLearnTimerRef.current)
    autoLearnTimerRef.current = null
  }

  const startLeave = (
    action: Leaving['action'],
    dragPos: DragPos,
    cardId = topCard?.id,
    skipHaptic = false
  ) => {
    if (!cardId) return

    cancelAutoLearn()
    clearMicFlash(cardId)

    if (!skipHaptic) {
      if (action === 'later') vibrateShort()
      if (action === 'learned') vibrateLong()
    }

    const leave: Leaving = {
      id: cardId,
      action,
      x: action === 'learned' ? -500 : action === 'later' ? 500 : dragPos.x * 1.2,
      y: action === 'delete' ? -700 : dragPos.y * 0.9,
      rotate: dragPos.x / 24,
    }

    setLeaving(leave)
    setDrag(null)
    dragRef.current = null
    setFlipped((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })

    leavingTimerRef.current = setTimeout(() => {
      commitLeave(action, cardId)
    }, LEAVE_MS)
  }

  const scheduleAutoLearn = (cardId: string) => {
    if (isLearnedFilter) return

    cancelAutoLearn()

    autoLearnTimerRef.current = setTimeout(() => {
      autoLearnTimerRef.current = null

      if (topCardIdRef.current !== cardId) return

      startLeave('learned', { x: 0, y: 0, startX: 0, startY: 0, pointerId: -1 }, cardId)
    }, 2000)
  }

  const {
    checkStatus,
    clearCheckStatus,
    clearMicFlash,
    handleSpeak,
    handleVoiceCheck,
    handleWriteCheck,
    listeningCardId,
    micFlash,
    resetChecks,
    writeFallbackCards,
  } = useLearnChecks({ courseLang, scheduleAutoLearn, setId, topCard })

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (leaving || !topCard || displayedQueue.length === 0) return

    if (event.pointerType === 'touch') {
      lastTouchRef.current = now()
    } else if (event.pointerType === 'mouse') {
      if (event.button !== 0) return
      // compatibility mouse events fired right after a touch gesture
      if (now() - lastTouchRef.current < 700) return
    }

    const next: DragPos = {
      x: 0,
      y: 0,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
    }

    dragRef.current = next
    setDrag(next)
    movedRef.current = false
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    if (!state || state.pointerId !== event.pointerId) return

    const next = {
      ...state,
      x: event.clientX - state.startX,
      y: event.clientY - state.startY,
    }

    if (Math.abs(next.x) > 8 || Math.abs(next.y) > 8) {
      movedRef.current = true
    }

    dragRef.current = next
    setDrag(next)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragRef.current

    if (event.pointerType === 'touch') {
      lastTouchRef.current = now()
    }

    if (!state || state.pointerId !== event.pointerId) return

    dragRef.current = null

    const horizontal = Math.abs(state.x) > Math.abs(state.y)

    if (state.y < -UP_THRESHOLD && !horizontal) {
      startLeave('delete', state)
      return
    }

    if (state.x > SWIPE_THRESHOLD && horizontal) {
      startLeave('later', state)
      return
    }

    if (state.x < -SWIPE_THRESHOLD && horizontal) {
      startLeave('learned', state)
      return
    }

    setDrag(null)
  }

  const handlePointerCancel = () => {
    lastTouchRef.current = now()
    dragRef.current = null
    setDrag(null)
  }

  const handleFlip = () => {
    if (!topCard || leaving || movedRef.current) return

    setFlipped((prev) => ({ ...prev, [topCard.id]: !prev[topCard.id] }))
  }

  const handleFilterChange = (next: Filter) => {
    clearCheckStatus()
    setFilter(next)

    if (next === 'unlearned') {
      setFlipped({})
      setExcluded(new Set())
    }
  }

  const handleDeleteAll = () => {
    clearCheckStatus()
    deleteCardsFx({ setId, learned: isLearnedFilter })
    setExcluded(new Set())
  }

  const handleRestart = () => {
    clearCheckStatus()
    setFlipped({})
    setExcluded(new Set())
  }

  const handleConfirmReset = async () => {
    cancelAutoLearn()
    await resetSetFx(setId)
    setConfirmReset(false)
    clearCheckStatus()
    setFlipped({})
    setExcluded(new Set())
    setFilter('unlearned')
  }

  const handleNextSet = () => {
    if (!set) {
      popScreen()
      return
    }

    const next = findNextSet(sets, set)

    if (next) {
      pushScreen(nextSetScreen(next, courseLang))
      return
    }

    popScreen()
  }

  const handleAddWord = () => {
    pushScreen({ name: 'card-create', setId })
  }

  const handleEditCard = (cardId: string) => {
    pushScreen({ name: 'card-create', setId, cardId })
  }

  const handleOpenSetText = () => {
    clearCheckStatus()

    const hasText = set
      ? Object.values(set.texts).some((text) => (text ?? '').trim().length > 0)
      : false

    pushScreen(hasText ? { name: 'set-intro', setId } : { name: 'set-text', setId })
  }

  const handleConfirmDeleteSet = async () => {
    await deleteSetFx(setId)
    popScreen()
  }

  const handleStartTest = () => {
    cancelAutoLearn()

    if (leavingTimerRef.current) {
      clearTimeout(leavingTimerRef.current)
      leavingTimerRef.current = null
    }

    if (recognizeFx.pending.getState()) cancelRecognizeFx()

    resetChecks()
    setLeaving(null)
    setDrag(null)
    dragRef.current = null
    setFlipped({})
    setTestMode(true)
  }

  if (testMode) {
    return <TestMode setId={setId} onExit={() => setTestMode(false)} />
  }

  const learnDeck = displayedQueue.slice(0, DECK_DEPTH)

  const finishedUnlearned = !isLearnedFilter && allSwiped && unlearnedCount === 0
  const finishedWithRestart = !isLearnedFilter && allSwiped && unlearnedCount > 0
  const finishedLearned = isLearnedFilter && allSwiped && learnedCount > 0

  const finishVariant: LearnFinishVariant | null = confirmDelete
    ? 'confirm-delete-set'
    : noCards
      ? 'no-cards'
      : finishedWithRestart
        ? 'viewed-all'
        : finishedUnlearned
          ? 'all-learned'
          : finishedLearned
            ? 'viewed-learned'
            : allSwiped && isLearnedFilter
              ? 'no-learned'
              : null

  return (
    <Box grow height="100%">
      <Header
        back
        endToolbar={
          <SetMenu
            setId={setId}
            swapped={set?.swapped ?? false}
            onAddCard={handleAddWord}
            onDeleteCards={handleDeleteAll}
            onDeleteSet={() => setConfirmDelete(true)}
            onResetSet={() => setConfirmReset(true)}
          />
        }
        text={set?.name ?? ''}
        onBackClick={() => popScreen()}
      />

      <Box grow padding="m">
        <Stack spacing="l" height="100%">
          <FilterBar
            isLearnedFilter={isLearnedFilter}
            learnedCount={learnedCount}
            unlearnedCount={unlearnedCount}
            onFilterChange={handleFilterChange}
            onOpenSetText={handleOpenSetText}
          />

          {finishVariant ? (
            <LearnFinish
              deletePending={deleteSetPending}
              setName={set?.name ?? ''}
              variant={finishVariant}
              onAddCard={handleAddWord}
              onCancelDeleteSet={() => setConfirmDelete(false)}
              onConfirmDeleteSet={handleConfirmDeleteSet}
              onNextSet={handleNextSet}
              onRestart={handleRestart}
            />
          ) : (
            <Box grow position="relative" minHeight={280}>
              {learnDeck.map((id, index) => {
                const card = byId.get(id)
                if (!card) return null

                const front = getCardText(card, set?.swapped ? userLang : courseLang)
                const back = getCardText(card, set?.swapped ? courseLang : userLang)

                return (
                  <FlashCard
                    key={id}
                    asrProgress={asrProgress}
                    backText={back.text}
                    checkStatus={
                      checkStatus?.cardId === id
                        ? { kind: checkStatus.kind, message: checkStatus.message }
                        : null
                    }
                    counter={index === 0 ? counter : undefined}
                    depth={index}
                    drag={index === 0 ? drag : null}
                    flipped={!!flipped[id]}
                    frontText={front.text}
                    interactive={index === 0}
                    leaving={leaving?.id === id ? leaving : null}
                    listening={listeningCardId === id}
                    micFlash={micFlash?.cardId === id ? micFlash.kind : null}
                    onEdit={() => handleEditCard(id)}
                    onFlip={handleFlip}
                    onPointerCancel={handlePointerCancel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onSpeakBack={() => handleSpeak(back.text, back.lang)}
                    onSpeakFront={() => handleSpeak(front.text, front.lang)}
                    onVoiceCheck={handleVoiceCheck}
                    onWriteCheck={handleWriteCheck}
                    testMode={false}
                    voiceCheckEnabled={voiceCheckEnabled}
                    writeCheck={card.writeCheck}
                    writeCheckEnabled={writeCheckEnabled}
                    writeCheckFallback={writeFallbackCards.has(id)}
                    writePlaceholder={getLanguageName(courseLang, languages)}
                  />
                )
              })}
            </Box>
          )}

          {!noCards && !confirmDelete ? <SwipeHints /> : null}

          {!noCards && !confirmDelete ? (
            <div {...testHintShake}>
              <Button fullWidth startIcon={<IconEducation fontSize={16} />} onClick={handleStartTest}>
                <FormattedMessage id="cards_mode_test" defaultMessage="Test" />
              </Button>
            </div>
          ) : null}
        </Stack>
      </Box>

      <ConfirmSheet
        opened={confirmReset}
        text={
          <FormattedMessage
            id="cards_reset_confirm"
            defaultMessage="Are you sure you want to reset the results? The cards will go back to unlearned as if you never touched them."
          />
        }
        onClosed={() => setConfirmReset(false)}
      >
        <Button fullWidth loading={resetPending} onClick={handleConfirmReset}>
          <FormattedMessage id="cards_reset_confirm_yes" defaultMessage="Yes" />
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setConfirmReset(false)}>
          <FormattedMessage id="common_cancel" defaultMessage="Cancel" />
        </Button>
      </ConfirmSheet>
    </Box>
  )
}
