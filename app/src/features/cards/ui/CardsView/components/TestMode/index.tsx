import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

import { useUnit } from 'effector-react'

import { IconEducation, IconPlay, IconStop } from '@elemental/icons'
import { Box, Button, ButtonIcon, EmptyScreen, Header, Stack, Text } from '@elemental/ui-kit'

import { getCardText } from '../../../../../../lib/cards'
import { isAnswerCorrect } from '../../../../../../lib/checks'
import { DEFAULT_COURSE_LANG, getLanguageName } from '../../../../../../lib/languages'
import { isShortSingleWord } from '../../../../../../lib/pronunciation'
import {
  isSilentRecognitionError,
  recognizeErrorText,
} from '../../../../../../lib/recognitionErrors'
import {
  playDisappointment,
  playError,
  playSuccess,
  playTestSuccess,
  unlockSounds,
} from '../../../../../../lib/sounds'
import type { Card as CardModel } from '../../../../../../lib/types'
import { Confetti } from '../../../../../../shared/ui/Confetti'
import { ExamResults } from '../../../../../../shared/ui/ExamResults'
import { $asrProgress, ensureAsrReadyFx } from '../../../../../../shared/ui/RecognitionSheet'
import { vibrateError, vibrateSuccess } from '../../../../../../transport/haptics'
import { canRecognize } from '../../../../../../transport/recognition'
import { setKeepAwake } from '../../../../../../transport/wakeLock'
import { $languages } from '../../../../../languages/store'
import { $stack, popTo, pushScreen } from '../../../../../navigation/store'
import {
  setCardLearnedFx,
  setSetExamPassedFx,
  $courseLangByLesson,
  $sets,
} from '../../../../../sets/store'
import { $debugMode, $userLang, $voiceCheckEnabled } from '../../../../../theme/store'
import { cancelRecognizeFx, isRecognizeCancelled, recognizeFx } from '../../../../store'
import { FlashCard } from '../FlashCard'
import type { CheckStatus, Leaving } from '../FlashCard'
import {
  DECK_DEPTH,
  findNextSet,
  LEAVE_MS,
  MIC_FLASH_MS,
  modelRecognitionText,
  nextSetScreen,
  VOICE_FALLBACK_ATTEMPTS,
  VOICE_FALLBACK_HINT,
} from '../../helpers'

import classes from '../../CardsView.module.pcss'

const AUTO_DELAY_MS = 1000
const TEST_VERDICT_MS = 1200
const TEST_MAX_ATTEMPTS = 3

type MicFlash = { cardId: string; kind: 'error' | 'success' }

export function TestMode({ setId, onExit }: { setId: string; onExit: () => void }) {
  const sets = useUnit($sets)
  const languages = useUnit($languages)
  const stack = useUnit($stack)
  const userLang = useUnit($userLang)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const voiceCheckEnabled = useUnit($voiceCheckEnabled)
  const debugMode = useUnit($debugMode)
  const asrProgress = useUnit($asrProgress)
  const recognizing = useUnit(recognizeFx.pending)

  const [testIndex, setTestIndex] = useState(0)
  const [testResults, setTestResults] = useState<boolean[]>([])
  const [testStatus, setTestStatus] = useState<CheckStatus | null>(null)
  const [testAuto, setTestAuto] = useState(false)
  const [testAutoTick, setTestAutoTick] = useState(0)
  const [testManualTick, setTestManualTick] = useState(0)
  const [testWriteFallbackCards, setTestWriteFallbackCards] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const [leaving, setLeaving] = useState<Leaving | null>(null)
  const [listeningCardId, setListeningCardId] = useState<string | null>(null)
  const [micFlash, setMicFlash] = useState<MicFlash | null>(null)

  const activeRef = useRef(true)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leavingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const micFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const testIndexRef = useRef(0)
  const testResultsRef = useRef<boolean[]>([])
  const testAttemptRef = useRef(1)
  const testAnsweredRef = useRef(false)
  const testCelebratedRef = useRef(false)
  const testAdvancingRef = useRef(false)
  const testAutoRef = useRef(false)
  const testAutoCardRef = useRef<string | null>(null)
  const testCardIdRef = useRef<string | null>(null)
  const testVoiceFailuresRef = useRef<Map<string, number>>(new Map())

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId])
  const courseLang = (set ? courseLangByLesson.get(set.lessonId) : undefined) ?? DEFAULT_COURSE_LANG
  const byId = useMemo(() => {
    const map = new Map<string, CardModel>()
    set?.cards.forEach((card) => map.set(card.id, card))
    return map
  }, [set])

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
  const testFinished = testQueue.length > 0 && testIndex >= testQueue.length

  useEffect(() => {
    testCardIdRef.current = testCardId ?? null
  }, [testCardId])

  useEffect(() => {
    activeRef.current = true

    return () => {
      activeRef.current = false
      testAutoRef.current = false

      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      if (leavingTimerRef.current) clearTimeout(leavingTimerRef.current)
      if (micFlashTimerRef.current) clearTimeout(micFlashTimerRef.current)
    }
  }, [])

  const flashMic = (cardId: string, kind: 'error' | 'success') => {
    if (micFlashTimerRef.current) clearTimeout(micFlashTimerRef.current)

    setMicFlash({ cardId, kind })

    micFlashTimerRef.current = setTimeout(() => {
      micFlashTimerRef.current = null
      setMicFlash((current) => (current?.cardId === cardId ? null : current))
    }, MIC_FLASH_MS)
  }

  const stopTestAuto = () => {
    if (!testAutoRef.current) return

    testAutoRef.current = false
    setTestAuto(false)
    setListeningCardId(null)

    if (recognizeFx.pending.getState()) cancelRecognizeFx()
  }

  const resetTestProgress = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

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

  const animateLeave = (cardId: string, action: 'learned' | 'later') => {
    if (micFlashTimerRef.current) clearTimeout(micFlashTimerRef.current)

    micFlashTimerRef.current = null
    setMicFlash((current) => (current?.cardId === cardId ? null : current))
    setLeaving({
      id: cardId,
      action,
      x: action === 'learned' ? -500 : 500,
      y: 0,
      rotate: 0,
    })
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

      animateLeave(cardId, passed ? 'learned' : 'later')

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
    if (!activeRef.current || testCardIdRef.current !== cardId || testAdvancingRef.current) return

    const card = byId.get(cardId)

    if (!card) return

    const expected = getCardText(card, courseLang).text.trim()

    if (!expected) return

    const ready = await ensureAsrReadyFx(courseLang)

    if (!activeRef.current || testCardIdRef.current !== cardId) return

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

      if (!activeRef.current || testCardIdRef.current !== cardId || testAdvancingRef.current) {
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
      if (!activeRef.current || testCardIdRef.current !== cardId || testAdvancingRef.current) {
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
      if (activeRef.current) setListeningCardId(null)
    }
  })

  useEffect(() => {
    if (!testAuto || !testCardId || testFinished) return

    if (testAutoCardRef.current !== testCardId) {
      testAutoCardRef.current = testCardId
      testAttemptRef.current = 1
    }

    const timer = setTimeout(() => {
      runTestCheck(testCardId)
    }, AUTO_DELAY_MS)

    return () => clearTimeout(timer)
  }, [testAuto, testCardId, testAutoTick, testFinished])

  useEffect(() => {
    if (testManualTick === 0) return

    const cardId = testCardIdRef.current

    if (cardId) runTestCheck(cardId)
  }, [testManualTick])

  useEffect(() => {
    if (!testFinished || testCelebratedRef.current) return

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
  }, [byId, setId, testFinished, testQueue])

  useEffect(() => {
    if (!voiceCheckEnabled && testAutoRef.current) stopTestAuto()
  }, [voiceCheckEnabled])

  useEffect(() => {
    void setKeepAwake(true)

    return () => {
      void setKeepAwake(false)
    }
  }, [])

  const handleExit = () => {
    stopTestAuto()

    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    if (leavingTimerRef.current) {
      clearTimeout(leavingTimerRef.current)
      leavingTimerRef.current = null
    }

    onExit()
  }

  const handleRetake = () => {
    stopTestAuto()

    if (leavingTimerRef.current) {
      clearTimeout(leavingTimerRef.current)
      leavingTimerRef.current = null
    }

    if (recognizeFx.pending.getState()) cancelRecognizeFx()

    resetTestProgress()
    setLeaving(null)
    setMicFlash(null)
  }

  const handleNextSet = () => {
    if (!set) return

    const next = findNextSet(sets, set)

    if (next) {
      pushScreen(nextSetScreen(next, courseLang))
      return
    }

    if (stack.some((screen) => screen.name === 'lesson')) {
      popTo('lesson')
      return
    }

    pushScreen({ name: 'lesson', lessonId: set.lessonId })
  }

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

  const testDeck = testQueue.slice(testIndex, testIndex + DECK_DEPTH)
  const testCounter = { current: testIndex + 1, total: testQueue.length }
  const testCorrectCount = testResults.filter(Boolean).length
  const testErrorCount = testResults.length - testCorrectCount
  const testPassed = testResults.length === testQueue.length && testResults.every(Boolean)
  const voiceReady = voiceCheckEnabled && canRecognize()

  return (
    <Box grow height="100%">
      <Header back text="Тест" onBackClick={handleExit} />

      <Box grow padding="m">
        <Stack spacing="l" height="100%">
          {testFinished ? (
            <ExamResults
              correctCount={testCorrectCount}
              errorCount={testErrorCount}
              passed={testPassed}
              onBack={handleExit}
              onNext={handleNextSet}
              onRetake={handleRetake}
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
                    counter={index === 0 ? testCounter : undefined}
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
          )}

          {!testFinished && testQueue.length > 0 && !voiceReady ? (
            <Text align="center" color="contrast-secondary" variant="S / Medium">
              {voiceCheckEnabled
                ? 'Распознавание речи недоступно на устройстве'
                : 'Распознавание речи отключено в настройках'}
            </Text>
          ) : null}

          {!testFinished ? (
            <Stack direction="row" spacing="m" verticalAlign="center">
              <Button fullWidth onClick={handleExit}>
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

      {testFinished && testPassed ? <Confetti /> : null}
    </Box>
  )
}
