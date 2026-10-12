import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { useUnit } from 'effector-react'

import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCheck,
  IconCheckSmall,
  IconClose,
  IconEducation,
  IconPlay,
  IconPlusBig,
  IconStop,
  IconViewList,
} from '@elemental/icons'
import {
  Box,
  Button,
  ButtonIcon,
  EmptyScreen,
  Header,
  Spinner,
  Stack,
  Text,
} from '@elemental/ui-kit'

import { getCardText } from '../../../lib/cards'
import { isAnswerCorrect } from '../../../lib/checks'
import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import { isShortSingleWord } from '../../../lib/pronunciation'
import { recognizeErrorText, isSilentRecognitionError } from '../../../lib/recognitionErrors'
import {
  playDisappointment,
  playError,
  playSuccess,
  playTestSuccess,
  unlockSounds,
} from '../../../lib/sounds'
import type { Card as CardModel } from '../../../lib/types'
import { ConfirmSheet } from '../../../shared/ui/ConfirmSheet'
import { Confetti } from '../../../shared/ui/Confetti'
import { ExamResults } from '../../../shared/ui/ExamResults'
import { vibrateError, vibrateLong, vibrateShort, vibrateSuccess } from '../../../transport/haptics'
import { canRecognize } from '../../../transport/recognition'
import { setKeepAwake } from '../../../transport/wakeLock'
import { $languages } from '../../languages/store'
import { popScreen, pushScreen } from '../../navigation/store'
import {
  deleteCardFx,
  deleteCardsFx,
  deleteSetFx,
  fetchSetsFx,
  resetSetFx,
  setCardLearnedFx,
  setSetExamPassedFx,
  updateCardChecksFx,
  $courseLangByLesson,
  $sets,
  $setsLoading,
} from '../../sets/store'
import { SetMenu } from '../../sets/ui/SetMenu'
import {
  $debugMode,
  $learnAfterChecks,
  $userLang,
  $voiceCheckEnabled,
  $writeCheckEnabled,
} from '../../theme/store'
import { $asrProgress, ensureAsrReadyFx } from '../../../shared/ui/RecognitionSheet'
import { cancelRecognizeFx, isRecognizeCancelled, recognizeFx, speakFx } from '../store'
import { FlashCard } from './FlashCard'
import type { CheckStatus, DragPos, Leaving } from './FlashCard'

import classes from './CardsView.module.pcss'

const SWIPE_THRESHOLD = 110
const UP_THRESHOLD = 110
const LEAVE_MS = 260
const DECK_DEPTH = 3
const AUTO_DELAY_MS = 1000
const TEST_VERDICT_MS = 1200
const TEST_MAX_ATTEMPTS = 3
const MIC_FLASH_MS = 2000

const SPEAK_ERRORS: Record<string, string> = {
  language_not_supported: 'Нет голоса для этого языка',
  speech_unavailable: 'Озвучка недоступна на устройстве',
  voice_missing: 'Скачайте голос в Настройки → Озвучка',
  unknown_method: 'Обновите приложение',
}

const speakErrorText = (error: Error) => SPEAK_ERRORS[error.message] ?? 'Не удалось озвучить'

const modelRecognitionText = (candidates: string[]): string =>
  candidates.length > 0
    ? `Модель распознала: ${candidates.map((candidate) => `"${candidate}"`).join(', ')}`
    : 'Модель ничего не распознала'

const VOICE_FALLBACK_HINT = 'Не удалось распознать. Введите слово с клавиатуры.'

const VOICE_FALLBACK_ATTEMPTS = 2

const now = (): number => Date.now()

const noop = () => undefined

type Filter = 'learned' | 'unlearned'

export function CardsView({ setId }: { setId: string }) {
  const sets = useUnit($sets)
  const setsLoading = useUnit($setsLoading)

  const [filter, setFilter] = useState<Filter>('unlearned')
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(() => new Set())
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [drag, setDrag] = useState<DragPos | null>(null)
  const [leaving, setLeaving] = useState<Leaving | null>(null)
  const [checkStatus, setCheckStatus] = useState<(CheckStatus & { cardId: string }) | null>(null)
  const [listeningCardId, setListeningCardId] = useState<string | null>(null)
  const [micFlash, setMicFlash] = useState<{ cardId: string; kind: 'error' | 'success' } | null>(
    null
  )
  const [testMode, setTestMode] = useState(false)
  const [testIndex, setTestIndex] = useState(0)
  const [testResults, setTestResults] = useState<boolean[]>([])
  const [testStatus, setTestStatus] = useState<CheckStatus | null>(null)
  const [testAuto, setTestAuto] = useState(false)
  const [testAutoTick, setTestAutoTick] = useState(0)
  const [testManualTick, setTestManualTick] = useState(0)
  const [writeFallbackCards, setWriteFallbackCards] = useState<ReadonlySet<string>>(() => new Set())
  const [testWriteFallbackCards, setTestWriteFallbackCards] = useState<ReadonlySet<string>>(
    () => new Set()
  )

  const deleteSetPending = useUnit(deleteSetFx.pending)
  const resetPending = useUnit(resetSetFx.pending)
  const asrProgress = useUnit($asrProgress)
  const recognizing = useUnit(recognizeFx.pending)
  const learnAfterChecks = useUnit($learnAfterChecks)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const voiceCheckEnabled = useUnit($voiceCheckEnabled)
  const writeCheckEnabled = useUnit($writeCheckEnabled)
  const debugMode = useUnit($debugMode)

  const dragRef = useRef<DragPos | null>(null)
  const leavingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoLearnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const micFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topCardIdRef = useRef<string | null>(null)
  const movedRef = useRef(false)
  const lastTouchRef = useRef(0)
  const testModeRef = useRef(false)
  const testIndexRef = useRef(0)
  const testResultsRef = useRef<boolean[]>([])
  const testAttemptRef = useRef(1)
  const testAnsweredRef = useRef(false)
  const testCelebratedRef = useRef(false)
  const testAdvancingRef = useRef(false)
  const testAutoRef = useRef(false)
  const testAutoCardRef = useRef<string | null>(null)
  const testCardIdRef = useRef<string | null>(null)
  const voiceFailuresRef = useRef<Map<string, number>>(new Map())
  const testVoiceFailuresRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    fetchSetsFx()
  }, [])

  useEffect(() => {
    return () => {
      testModeRef.current = false
      testAutoRef.current = false

      if (leavingTimerRef.current) clearTimeout(leavingTimerRef.current)
      if (autoLearnTimerRef.current) clearTimeout(autoLearnTimerRef.current)
      if (micFlashTimerRef.current) clearTimeout(micFlashTimerRef.current)
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)

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

  const learnedCount = useMemo(
    () =>
      set ? set.cards.reduce((acc, card) => (card.learned && !card.deleted ? acc + 1 : acc), 0) : 0,
    [set]
  )

  const unlearnedCount = useMemo(
    () => (set ? set.cards.filter((card) => !card.learned && !card.deleted).length : 0),
    [set]
  )

  const allSwiped = displayedQueue.length === 0
  const noCards = set ? set.cards.every((card) => card.deleted) : true

  const testQueue = useMemo(
    () =>
      set
        ? set.cards
            .filter((card) => !card.deleted && getCardText(card, courseLang).text.trim().length > 0)
            .map((card) => card.id)
        : [],
    [set, courseLang]
  )

  const testCardId = testIndex < testQueue.length ? testQueue[testIndex] : undefined
  const testFinished = testMode && testQueue.length > 0 && testIndex >= testQueue.length

  useEffect(() => {
    testCardIdRef.current = testCardId ?? null
  }, [testCardId])

  const commitLeave = (action: Leaving['action'], cardId: string) => {
    setLeaving(null)
    setCheckStatus(null)

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
    skipHaptic = false,
    onCommitted?: () => void
  ) => {
    if (!cardId) return

    cancelAutoLearn()

    if (micFlashTimerRef.current) clearTimeout(micFlashTimerRef.current)

    micFlashTimerRef.current = null
    setMicFlash((current) => (current?.cardId === cardId ? null : current))

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
      if (onCommitted) {
        onCommitted()
      } else {
        commitLeave(action, cardId)
      }
    }, LEAVE_MS)
  }

  const showCheckStatus = (cardId: string, kind: CheckStatus['kind'], message: string) => {
    setCheckStatus({ cardId, kind, message })
  }

  const flashMic = (cardId: string, kind: 'error' | 'success') => {
    if (micFlashTimerRef.current) clearTimeout(micFlashTimerRef.current)

    setMicFlash({ cardId, kind })

    micFlashTimerRef.current = setTimeout(() => {
      micFlashTimerRef.current = null
      setMicFlash((current) => (current?.cardId === cardId ? null : current))
    }, MIC_FLASH_MS)
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

  const resetTestTimers = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }

  const resetTestProgress = () => {
    resetTestTimers()
    testIndexRef.current = 0
    testResultsRef.current = []
    testAttemptRef.current = 1
    testAnsweredRef.current = false
    testCelebratedRef.current = false
    testAdvancingRef.current = false
    testAutoCardRef.current = null
    testVoiceFailuresRef.current = new Map()
    setTestIndex(0)
    setTestResults([])
    setTestStatus(null)
    setTestWriteFallbackCards(new Set())
  }

  const stopTestAuto = () => {
    if (!testAutoRef.current) return

    testAutoRef.current = false
    setTestAuto(false)
    setListeningCardId(null)

    if (recognizeFx.pending.getState()) cancelRecognizeFx()
  }

  const offerWriteFallback = (cardId: string, expected: string): boolean => {
    if (!isShortSingleWord(expected)) return false

    const failures = (voiceFailuresRef.current.get(cardId) ?? 0) + 1

    voiceFailuresRef.current.set(cardId, failures)

    if (failures < VOICE_FALLBACK_ATTEMPTS) return false

    setWriteFallbackCards((current) => new Set(current).add(cardId))

    return true
  }

  const offerTestWriteFallback = (cardId: string, expected: string): boolean => {
    if (!isShortSingleWord(expected)) return false

    const failures = (testVoiceFailuresRef.current.get(cardId) ?? 0) + 1

    testVoiceFailuresRef.current.set(cardId, failures)

    if (failures < VOICE_FALLBACK_ATTEMPTS) return false

    if (testAutoRef.current) stopTestAuto()

    setTestWriteFallbackCards((current) => new Set(current).add(cardId))

    return true
  }

  const markTestAnswered = () => {
    if (testAnsweredRef.current) return

    testAnsweredRef.current = true

    if (set?.examPassed) setSetExamPassedFx({ setId, examPassed: false })
  }

  const applyTestVerdict = (cardId: string, passed: boolean, message: string) => {
    if (testAdvancingRef.current) return

    testAdvancingRef.current = true
    markTestAnswered()

    testResultsRef.current = [...testResultsRef.current, passed]
    setTestResults(testResultsRef.current)
    setTestStatus({ kind: passed ? 'success' : 'error', message })

    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null

      startLeave(
        passed ? 'learned' : 'later',
        { x: 0, y: 0, startX: 0, startY: 0, pointerId: -1 },
        cardId,
        true,
        noop
      )

      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null
        testAdvancingRef.current = false
        setTestStatus(null)
        testAttemptRef.current = 1
        setLeaving(null)
        testIndexRef.current += 1
        setTestIndex(testIndexRef.current)
      }, LEAVE_MS)
    }, TEST_VERDICT_MS)
  }

  const runTestCheck = useEffectEvent(async (cardId: string) => {
    if (!testModeRef.current || testCardIdRef.current !== cardId || testAdvancingRef.current) return

    const card = byId.get(cardId)

    if (!card) return

    const expected = getCardText(card, courseLang).text.trim()

    if (!expected) return

    const ready = await ensureAsrReadyFx(courseLang)

    if (!testModeRef.current || testCardIdRef.current !== cardId) return

    if (!ready) {
      stopTestAuto()
      return
    }

    unlockSounds()
    setListeningCardId(cardId)

    try {
      const { assessment, candidates } = await recognizeFx({
        cardId,
        lang: courseLang,
        side: 'front',
        text: expected,
      })

      if (!testModeRef.current || testCardIdRef.current !== cardId || testAdvancingRef.current) {
        return
      }

      markTestAnswered()

      if (assessment.verdict === 'good') {
        flashMic(cardId, 'success')
        playSuccess()
        vibrateSuccess()
        applyTestVerdict(
          cardId,
          true,
          debugMode ? `Принято! ${modelRecognitionText(candidates)}` : 'Принято!'
        )
        return
      }

      flashMic(cardId, 'error')
      playError()
      vibrateError()

      const attempt = testAttemptRef.current
      const attemptsLeft = TEST_MAX_ATTEMPTS - attempt
      const debugText = debugMode ? ` ${modelRecognitionText(candidates)}.` : ''
      const message = `Ошибка!${debugText}`

      if (attemptsLeft <= 0) {
        applyTestVerdict(cardId, false, message)
        return
      }

      const hinted = offerTestWriteFallback(cardId, expected)
        ? VOICE_FALLBACK_HINT
        : `Осталось попыток: ${attemptsLeft}`

      testAttemptRef.current = attempt + 1
      setTestStatus({ kind: 'error', message: `${message} ${hinted}` })

      if (testAutoRef.current) setTestAutoTick((value) => value + 1)
    } catch (error) {
      if (isRecognizeCancelled(error)) return
      if (!testModeRef.current || testCardIdRef.current !== cardId || testAdvancingRef.current) {
        return
      }

      if (isSilentRecognitionError(error)) {
        if (offerTestWriteFallback(cardId, expected)) {
          setTestStatus({ kind: 'error', message: VOICE_FALLBACK_HINT })
        } else if (debugMode) {
          setTestStatus({ kind: 'error', message: modelRecognitionText([]) })
        }

        if (testAutoRef.current) setTestAutoTick((value) => value + 1)
        return
      }

      playError()
      vibrateError()

      const errorText = recognizeErrorText(
        error instanceof Error ? error : new Error('recognition_failed')
      )
      const message = offerTestWriteFallback(cardId, expected) ? VOICE_FALLBACK_HINT : errorText

      setTestStatus({
        kind: 'error',
        message: debugMode ? `${message}. ${modelRecognitionText([])}` : message,
      })

      if (testAutoRef.current) setTestAutoTick((value) => value + 1)
    } finally {
      if (testModeRef.current) setListeningCardId(null)
    }
  })

  useEffect(() => {
    if (!testMode || !testAuto || !testCardId || testFinished) return

    if (testAutoCardRef.current !== testCardId) {
      testAutoCardRef.current = testCardId
      testAttemptRef.current = 1
    }

    const timer = setTimeout(() => {
      runTestCheck(testCardId)
    }, AUTO_DELAY_MS)

    return () => clearTimeout(timer)
  }, [testMode, testAuto, testCardId, testAutoTick, testFinished])

  useEffect(() => {
    if (testManualTick === 0) return

    const cardId = testCardIdRef.current

    if (cardId) runTestCheck(cardId)
  }, [testManualTick])

  useEffect(() => {
    if (!testMode || !testFinished || testCelebratedRef.current) return

    testCelebratedRef.current = true

    const results = testResultsRef.current
    const passed = results.length === testQueue.length && results.every(Boolean)

    if (passed) {
      playTestSuccess()
    } else {
      playDisappointment()
    }

    setSetExamPassedFx({ setId, examPassed: passed })

    testQueue.forEach((cardId, index) => {
      const card = byId.get(cardId)
      const learned = results[index] === true

      if (card && card.learned !== learned) {
        setCardLearnedFx({ setId, cardId, learned })
      }
    })
  }, [byId, setId, testFinished, testMode, testQueue])

  useEffect(() => {
    if (!voiceCheckEnabled && testAutoRef.current) stopTestAuto()
  }, [voiceCheckEnabled])

  useEffect(() => {
    if (!testMode) return

    void setKeepAwake(true)

    return () => {
      void setKeepAwake(false)
    }
  }, [testMode])

  const handleTestAutoToggle = () => {
    if (testAutoRef.current) {
      stopTestAuto()
      return
    }

    if (recognizeFx.pending.getState()) cancelRecognizeFx()
    if (testAdvancingRef.current || !testCardId) return

    testAttemptRef.current = 1
    testAutoCardRef.current = testCardId
    setTestStatus(null)
    testAutoRef.current = true
    setTestAuto(true)
  }

  const handleTestVoiceCheck = () => {
    if (testAutoRef.current) {
      stopTestAuto()
      return
    }

    if (recognizing) {
      cancelRecognizeFx()
      return
    }

    if (!testCardId || testAdvancingRef.current) return

    setTestManualTick((value) => value + 1)
  }

  const handleTestWriteCheck = (value: string) => {
    const cardId = testCardIdRef.current

    if (!cardId || testAdvancingRef.current) return

    const card = byId.get(cardId)

    if (!card) return

    const expected = getCardText(card, courseLang).text.trim()

    if (!expected) return

    unlockSounds()

    if (isAnswerCorrect(expected, value)) {
      playSuccess()
      vibrateSuccess()
      applyTestVerdict(cardId, true, 'Принято!')
      return
    }

    playError()
    vibrateError()

    const attempt = testAttemptRef.current
    const attemptsLeft = TEST_MAX_ATTEMPTS - attempt

    if (attemptsLeft <= 0) {
      applyTestVerdict(cardId, false, 'Ошибка!')
      return
    }

    testAttemptRef.current = attempt + 1
    setTestStatus({ kind: 'error', message: `Ошибка! Осталось попыток: ${attemptsLeft}` })
  }

  const handleStartTest = () => {
    cancelAutoLearn()

    if (leavingTimerRef.current) {
      clearTimeout(leavingTimerRef.current)
      leavingTimerRef.current = null
    }

    if (recognizeFx.pending.getState()) cancelRecognizeFx()

    resetTestProgress()
    setCheckStatus(null)
    setMicFlash(null)
    setLeaving(null)
    setDrag(null)
    dragRef.current = null
    setFlipped({})
    testModeRef.current = true
    setTestMode(true)
  }

  const handleExitTest = () => {
    stopTestAuto()

    if (leavingTimerRef.current) {
      clearTimeout(leavingTimerRef.current)
      leavingTimerRef.current = null
    }

    resetTestProgress()
    testModeRef.current = false
    setTestMode(false)
    setLeaving(null)
    setListeningCardId(null)
    setCheckStatus(null)
    setMicFlash(null)
  }

  const handleRetakeTest = () => {
    stopTestAuto()

    if (leavingTimerRef.current) {
      clearTimeout(leavingTimerRef.current)
      leavingTimerRef.current = null
    }

    if (recognizeFx.pending.getState()) cancelRecognizeFx()

    resetTestProgress()
    setLeaving(null)
    setCheckStatus(null)
    setMicFlash(null)
  }

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
    setCheckStatus(null)
    setFilter(next)

    if (next === 'unlearned') {
      setFlipped({})
      setExcluded(new Set())
    }
  }

  const handleDeleteAll = () => {
    setCheckStatus(null)
    deleteCardsFx({ setId, learned: isLearnedFilter })
    setExcluded(new Set())
  }

  const handleRestart = () => {
    setCheckStatus(null)
    setFlipped({})
    setExcluded(new Set())
  }

  const handleConfirmReset = async () => {
    cancelAutoLearn()
    await resetSetFx(setId)
    setConfirmReset(false)
    setCheckStatus(null)
    setFlipped({})
    setExcluded(new Set())
    setFilter('unlearned')
  }

  const handleNextSet = () => {
    if (!set) {
      popScreen()
      return
    }

    const next = sets
      .filter(
        (item) =>
          item.active &&
          item.id !== set.id &&
          item.lessonId === set.lessonId &&
          item.order > set.order
      )
      .sort((a, b) => a.order - b.order)[0]

    if (next) {
      const hasText = (next.texts[courseLang] ?? '').trim().length > 0

      pushScreen(
        hasText ? { name: 'set-intro', setId: next.id } : { name: 'cards', setId: next.id }
      )
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

  const handleVoiceCheck = async () => {
    if (!topCard) return

    if (recognizing) {
      cancelRecognizeFx()
      return
    }

    const expected = getCardText(topCard, courseLang).text.trim()

    if (!expected) return

    const ready = await ensureAsrReadyFx(courseLang)

    if (!ready) return

    unlockSounds()
    setListeningCardId(topCard.id)

    try {
      const { assessment, candidates } = await recognizeFx({
        cardId: topCard.id,
        lang: courseLang,
        side: 'front',
        text: expected,
      })
      const passed = assessment.verdict === 'good'

      await updateCardChecksFx({ setId, cardId: topCard.id, checks: { voiceCheck: passed } })

      flashMic(topCard.id, passed ? 'success' : 'error')

      if (passed) {
        voiceFailuresRef.current.delete(topCard.id)
        playSuccess()
        vibrateSuccess()
        showCheckStatus(
          topCard.id,
          'success',
          debugMode ? `Принято! ${modelRecognitionText(candidates)}` : 'Принято!'
        )
      } else {
        playError()
        vibrateError()

        if (offerWriteFallback(topCard.id, expected)) {
          showCheckStatus(
            topCard.id,
            'error',
            debugMode
              ? `${VOICE_FALLBACK_HINT} ${modelRecognitionText(candidates)}`
              : VOICE_FALLBACK_HINT
          )
        } else {
          const message = `Ошибка! Услышано "${assessment.transcript}", нужно ${expected}`

          showCheckStatus(
            topCard.id,
            'error',
            debugMode ? `${message}. ${modelRecognitionText(candidates)}` : message
          )
        }
      }

      const writeReady = !writeCheckEnabled || topCard.writeCheck === true

      if (passed && learnAfterChecks && writeReady) {
        scheduleAutoLearn(topCard.id)
      }
    } catch (error) {
      if (isRecognizeCancelled(error)) return

      if (isSilentRecognitionError(error)) {
        if (offerWriteFallback(topCard.id, expected)) {
          showCheckStatus(topCard.id, 'error', VOICE_FALLBACK_HINT)
        } else if (debugMode) {
          showCheckStatus(topCard.id, 'error', modelRecognitionText([]))
        }

        return
      }

      playError()
      vibrateError()

      const errorText = recognizeErrorText(
        error instanceof Error ? error : new Error('recognition_failed')
      )
      const message = offerWriteFallback(topCard.id, expected) ? VOICE_FALLBACK_HINT : errorText

      showCheckStatus(
        topCard.id,
        'error',
        debugMode ? `${message}. ${modelRecognitionText([])}` : message
      )
    } finally {
      setListeningCardId(null)
    }
  }

  const handleWriteCheck = async (value: string) => {
    if (!topCard) return

    const expected = getCardText(topCard, courseLang).text.trim()

    if (!expected) return

    unlockSounds()

    const passed = isAnswerCorrect(expected, value)

    await updateCardChecksFx({ setId, cardId: topCard.id, checks: { writeCheck: passed } })

    if (passed) {
      playSuccess()
      vibrateSuccess()
      showCheckStatus(topCard.id, 'success', 'Принято!')
    } else {
      playError()
      vibrateError()
      showCheckStatus(topCard.id, 'error', `Ошибка! Нужно ${expected}, ваш текст ${value}`)
    }

    const voiceReady = !voiceCheckEnabled || topCard.voiceCheck === true

    if (passed && learnAfterChecks && voiceReady) {
      scheduleAutoLearn(topCard.id)
    }
  }

  const handleSpeak = async (text: string, lang: LanguageCode) => {
    if (!topCard || !text.trim()) return

    try {
      await speakFx({ text, lang })
    } catch (error) {
      const failure = error instanceof Error ? error : new Error('speak_failed')
      showCheckStatus(topCard.id, 'error', speakErrorText(failure))
    }
  }

  const handleOpenSetText = () => {
    setCheckStatus(null)

    const hasText = set
      ? Object.values(set.texts).some((text) => (text ?? '').trim().length > 0)
      : false

    pushScreen(hasText ? { name: 'set-intro', setId } : { name: 'set-text', setId })
  }

  const handleConfirmDeleteSet = async () => {
    await deleteSetFx(setId)
    popScreen()
  }

  if (!set) {
    return (
      <Box grow height="100%">
        <Header back text="Задание" onBackClick={() => popScreen()} />
        {setsLoading ? (
          <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
            <Spinner size="l" />
          </Stack>
        ) : (
          <EmptyScreen
            fullHeight
            icon={<IconEducation fontSize={24} />}
            text="Задание не найдено"
          />
        )}
      </Box>
    )
  }

  const learnDeck = displayedQueue.slice(0, DECK_DEPTH)
  const testDeck = testQueue.slice(testIndex, testIndex + DECK_DEPTH)

  const testCorrectCount = testResults.filter(Boolean).length
  const testErrorCount = testResults.length - testCorrectCount
  const testPassed = testResults.length === testQueue.length && testResults.every(Boolean)
  const voiceReady = voiceCheckEnabled && canRecognize()

  const finishedUnlearned = !isLearnedFilter && allSwiped && unlearnedCount === 0
  const finishedWithRestart = !isLearnedFilter && allSwiped && unlearnedCount > 0
  const finishedLearned = isLearnedFilter && allSwiped && learnedCount > 0

  return (
    <Box grow height="100%">
      <Header
        back
        endToolbar={
          testMode ? undefined : (
            <SetMenu
              setId={setId}
              swapped={set.swapped}
              onAddCard={handleAddWord}
              onDeleteCards={handleDeleteAll}
              onDeleteSet={() => setConfirmDelete(true)}
              onResetSet={() => setConfirmReset(true)}
            />
          )
        }
        text={testMode ? 'Тест' : set.name}
        onBackClick={testMode ? handleExitTest : () => popScreen()}
      />

      <Box grow padding="m">
        <Stack spacing="l" height="100%">
          {!testMode ? (
            <Stack direction="row" horizontalAlign="space-between">
              <Button
                checked={isLearnedFilter}
                color="neutral"
                startIcon={<IconCheckSmall fontSize={16} />}
                variant="secondary"
                onClick={() => handleFilterChange('learned')}
              >
                {learnedCount}
              </Button>
              <ButtonIcon
                ariaLabel="Текст задания"
                color="neutral"
                icon={<IconViewList fontSize={24} />}
                variant="secondary"
                onClick={handleOpenSetText}
              />
              <Button
                checked={!isLearnedFilter}
                color="neutral"
                startIcon={<IconClose fontSize={16} />}
                variant="secondary"
                onClick={() => handleFilterChange('unlearned')}
              >
                {unlearnedCount}
              </Button>
            </Stack>
          ) : null}

          {testMode ? (
            testFinished ? (
              <ExamResults
                correctCount={testCorrectCount}
                errorCount={testErrorCount}
                passed={testPassed}
                onBack={handleExitTest}
                onRetake={handleRetakeTest}
              />
            ) : testQueue.length === 0 ? (
              <EmptyScreen
                fullHeight
                icon={<IconEducation fontSize={24} />}
                text="Нет карточек для теста"
              />
            ) : (
              <Box grow position="relative" minHeight={280}>
                {testDeck.map((id, index) => {
                  const card = byId.get(id)
                  if (!card) return null

                  return (
                    <FlashCard
                      key={id}
                      asrProgress={asrProgress}
                      backText=""
                      checkStatus={testCardId === id ? testStatus : null}
                      depth={index}
                      drag={null}
                      flipped={false}
                      frontText={getCardText(card, userLang).text}
                      interactive={index === 0}
                      leaving={leaving?.id === id ? leaving : null}
                      listening={listeningCardId === id}
                      micFlash={micFlash?.cardId === id ? micFlash.kind : null}
                      onVoiceCheck={handleTestVoiceCheck}
                      onWriteCheck={handleTestWriteCheck}
                      testMode
                      voiceCheckEnabled={voiceCheckEnabled}
                      writeCheck={card.writeCheck}
                      writeCheckEnabled={false}
                      writeCheckFallback={testWriteFallbackCards.has(id)}
                      writePlaceholder={getLanguageName(courseLang, languages)}
                    />
                  )
                })}
              </Box>
            )
          ) : confirmDelete ? (
            <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
              <Text align="center" color="contrast-secondary" variant="S / Medium">
                Удалить задание «{set.name}» со всеми карточками?
              </Text>
              <Button color="negative" loading={deleteSetPending} onClick={handleConfirmDeleteSet}>
                Удалить
              </Button>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                Отмена
              </Button>
            </Stack>
          ) : noCards ? (
            <EmptyScreen
              action={
                <Button startIcon={<IconPlusBig fontSize={16} />} onClick={handleAddWord}>
                  Добавить
                </Button>
              }
              fullHeight
              icon={<IconEducation fontSize={24} />}
              text="Пока в задании нет карточек"
            />
          ) : finishedWithRestart ? (
            <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
              <Text align="center" color="contrast-secondary" variant="S / Medium">
                Вы посмотрели все карточки
              </Text>
              <Button onClick={handleRestart}>Начать сначала</Button>
              <Button variant="secondary" onClick={handleNextSet}>
                Перейти к следующему заданию
              </Button>
            </Stack>
          ) : finishedUnlearned ? (
            <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
              <IconCheck color="var(--positive-text-and-icons)" fontSize={32} />
              <Text align="center" color="contrast-secondary" variant="S / Medium">
                Все карточки выучены
              </Text>
              <Button variant="secondary" onClick={handleNextSet}>
                Перейти к следующему заданию
              </Button>
            </Stack>
          ) : finishedLearned ? (
            <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
              <Text align="center" color="contrast-secondary" variant="S / Medium">
                Вы посмотрели все выученные карточки
              </Text>
              <Button onClick={handleRestart}>Повторить</Button>
              <Button variant="secondary" onClick={handleNextSet}>
                Перейти к следующему заданию
              </Button>
            </Stack>
          ) : allSwiped && isLearnedFilter ? (
            <EmptyScreen
              fullHeight
              icon={<IconCheckSmall fontSize={24} />}
              text="Нет выученных карточек"
            />
          ) : (
            <Box grow position="relative" minHeight={280}>
              {learnDeck.map((id, index) => {
                const card = byId.get(id)
                if (!card) return null

                const front = getCardText(card, set.swapped ? userLang : courseLang)
                const back = getCardText(card, set.swapped ? courseLang : userLang)

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

          {!testMode && !noCards && !confirmDelete && (
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

          {testMode && !testFinished && testQueue.length > 0 && !voiceReady ? (
            <Text align="center" color="contrast-secondary" variant="S / Medium">
              {voiceCheckEnabled
                ? 'Распознавание речи недоступно на устройстве'
                : 'Распознавание речи отключено в настройках'}
            </Text>
          ) : null}

          {!testMode && !noCards && !confirmDelete ? (
            <Button fullWidth startIcon={<IconEducation fontSize={16} />} onClick={handleStartTest}>
              Тест
            </Button>
          ) : null}

          {testMode && !testFinished ? (
            <Stack direction="row" spacing="m" verticalAlign="center">
              <Button fullWidth onClick={handleExitTest}>
                Отмена
              </Button>
              {testQueue.length > 0 && voiceReady ? (
                <div className={testAuto ? classes.blink : undefined}>
                  <ButtonIcon
                    ariaLabel={
                      testAuto
                        ? 'Остановить автоматический режим'
                        : 'Запустить автоматический режим'
                    }
                    icon={testAuto ? <IconStop fontSize={24} /> : <IconPlay fontSize={24} />}
                    size="m"
                    variant="secondary"
                    onClick={handleTestAutoToggle}
                  />
                </div>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </Box>

      <ConfirmSheet
        opened={confirmReset}
        text="Вы уверены, что хотите сбросить результаты? Карточки вернутся в невыученные, как будто вы их не трогали."
        onClosed={() => setConfirmReset(false)}
      >
        <Button fullWidth loading={resetPending} onClick={handleConfirmReset}>
          Да
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setConfirmReset(false)}>
          Отмена
        </Button>
      </ConfirmSheet>
      {testMode && testFinished && testPassed ? <Confetti /> : null}
    </Box>
  )
}
