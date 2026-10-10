import { useEffect, useMemo, useRef, useState } from 'react'

import { useUnit } from 'effector-react'

import { IconEducation, IconMicrophone } from '@elemental/icons'
import {
  Box,
  Button,
  EmptyScreen,
  FormHelperText,
  Header,
  Spinner,
  Stack,
  Text,
  TextPanel,
} from '@elemental/ui-kit'

import { getCardText } from '../../../lib/cards'
import { DEFAULT_COURSE_LANG } from '../../../lib/languages'
import { recognizeErrorText } from '../../../lib/recognitionErrors'
import { playDisappointment, playError, playSalute, playSuccess, unlockSounds } from '../../../lib/sounds'
import type { Card as CardModel } from '../../../lib/types'
import { Confetti } from '../../../shared/ui/Confetti'
import { vibrateError, vibrateSuccess } from '../../../transport/haptics'
import { canRecognize } from '../../../transport/recognition'
import {
  cancelRecognizeFx,
  isRecognizeCancelled,
  recognizeFx,
  $asrStatus,
} from '../../cards/store'
import { popScreen } from '../../navigation/store'
import {
  fetchSetsFx,
  setSetExamPassedFx,
  $courseLangByLesson,
  $sets,
  $setsLoading,
} from '../../sets/store'

import classes from './SetExamView.module.pcss'

const ADVANCE_MS = 1500
const MAX_ATTEMPTS = 3

type ExamStatus = {
  kind: 'success' | 'error'
  message: string
}

function ExamSmiley({ happy }: { happy: boolean }) {
  return (
    <svg aria-hidden="true" height={80} viewBox="0 0 80 80" width={80}>
      <circle cx="40" cy="40" fill="#ffcc4a" r="35" stroke="#050505" strokeWidth="7" />
      <circle cx="28" cy="33" fill="#050505" r="5" />
      <circle cx="52" cy="33" fill="#050505" r="5" />
      <path
        d={happy ? 'M24 48Q40 70 56 48' : 'M24 62Q40 44 56 62'}
        fill="none"
        stroke="#050505"
        strokeLinecap="round"
        strokeWidth="6"
      />
    </svg>
  )
}

export function SetExamView({ setId }: { setId: string }) {
  const sets = useUnit($sets)
  const setsLoading = useUnit($setsLoading)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const asrStatus = useUnit($asrStatus)
  const recognizing = useUnit(recognizeFx.pending)
  const saveExamPassed = useUnit(setSetExamPassedFx)

  const [index, setIndex] = useState(0)
  const [attempt, setAttempt] = useState(1)
  const [results, setResults] = useState<boolean[]>([])
  const [status, setStatus] = useState<ExamStatus | null>(null)
  const [advancing, setAdvancing] = useState(false)

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const celebratedRef = useRef(false)

  const recognitionAvailable = useMemo(() => canRecognize(), [])

  useEffect(() => {
    fetchSetsFx()
  }, [])

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      if (recognizeFx.pending.getState()) cancelRecognizeFx()
    }
  }, [])

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId])
  const courseLang = (set ? courseLangByLesson.get(set.lessonId) : undefined) ?? DEFAULT_COURSE_LANG

  const queue = useMemo(
    () =>
      set
        ? set.cards
            .filter(
              (card) => !card.deleted && getCardText(card, courseLang).text.trim().length > 0
            )
            .map((card) => card.id)
        : [],
    [set, courseLang]
  )

  const byId = useMemo(() => {
    const map = new Map<string, CardModel>()
    set?.cards.forEach((card) => map.set(card.id, card))
    return map
  }, [set])

  const currentCard = index < queue.length ? byId.get(queue[index]) : undefined
  const finished = queue.length > 0 && index >= queue.length
  const correctCount = results.filter(Boolean).length
  const errorCount = results.length - correctCount
  const passed = results.length > 0 && results.length === queue.length && results.every(Boolean)

  useEffect(() => {
    if (!finished || celebratedRef.current) return

    celebratedRef.current = true

    if (passed) {
      playSalute()
    } else {
      playDisappointment()
    }
  }, [finished, passed])

  const handleVoiceCheck = async () => {
    if (recognizing) {
      cancelRecognizeFx()
      return
    }

    if (advancing || !currentCard) return

    const expected = getCardText(currentCard, courseLang).text.trim()

    if (!expected) return

    unlockSounds()
    setStatus(null)

    try {
      const assessment = await recognizeFx({
        cardId: currentCard.id,
        lang: courseLang,
        side: 'front',
        text: expected,
      })
      const passed = assessment.verdict === 'good'
      const lastAttempt = passed || attempt >= MAX_ATTEMPTS

      if (!lastAttempt) {
        setAttempt(attempt + 1)
        playError()
        vibrateError()
        setStatus({
          kind: 'error',
          message: `Ошибка! Услышано "${assessment.transcript}", нужно ${expected}. Осталось попыток: ${MAX_ATTEMPTS - attempt}`,
        })
        return
      }

      const nextResults = [...results, passed]

      setResults(nextResults)

      if (passed) {
        playSuccess()
        vibrateSuccess()
        setStatus({ kind: 'success', message: 'Принятно!' })
      } else {
        playError()
        vibrateError()
        setStatus({
          kind: 'error',
          message: `Ошибка! Услышано "${assessment.transcript}", нужно ${expected}`,
        })
      }

      if (nextResults.length === queue.length) {
        saveExamPassed({ setId, examPassed: nextResults.every(Boolean) })
      }

      setAdvancing(true)
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null
        setAdvancing(false)
        setAttempt(1)
        setStatus(null)
        setIndex((value) => value + 1)
      }, ADVANCE_MS)
    } catch (error) {
      if (isRecognizeCancelled(error)) return

      playError()
      vibrateError()
      setStatus({
        kind: 'error',
        message: recognizeErrorText(
          error instanceof Error ? error : new Error('recognition_failed')
        ),
      })
    }
  }

  const handleRetake = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    celebratedRef.current = false
    setAdvancing(false)
    setAttempt(1)
    setStatus(null)
    setResults([])
    setIndex(0)
  }

  if (!set) {
    return (
      <Box grow height="100%">
        <Header back text="Тест" onBackClick={() => popScreen()} />
        {setsLoading ? (
          <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
            <Spinner size="l" />
          </Stack>
        ) : (
          <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Задание не найдено" />
        )}
      </Box>
    )
  }

  if (queue.length === 0) {
    return (
      <Box grow height="100%">
        <Header back text="Тест" onBackClick={() => popScreen()} />
        <EmptyScreen
          action={<Button onClick={() => popScreen()}>Вернуться к обучению</Button>}
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text="Нет карточек для теста"
        />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header back text="Тест" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        {finished ? (
          <Stack spacing="l" height="100%">
            <TextPanel grow>
              <Stack
                grow
                height="100%"
                horizontalAlign="center"
                spacing="l"
                verticalAlign="center"
              >
                <ExamSmiley happy={passed} />
                <Stack spacing="s" width="100%">
                  <Stack direction="row" horizontalAlign="space-between" spacing="m">
                    <Text color="contrast-primary" variant="M / Medium">
                      Правильных ответов
                    </Text>
                    <Text color="positive-text-and-icons" variant="M / Medium">
                      {correctCount}
                    </Text>
                  </Stack>
                  <Stack direction="row" horizontalAlign="space-between" spacing="m">
                    <Text color="contrast-primary" variant="M / Medium">
                      Ошибок
                    </Text>
                    <Text color="negative-text-and-icons" variant="M / Medium">
                      {errorCount}
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
            </TextPanel>
            <Stack spacing="m">
              <Button fullWidth onClick={handleRetake}>
                Пройти тест снова
              </Button>
              <Button fullWidth variant="secondary" onClick={() => popScreen()}>
                Вернуться к обучению
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing="l" height="100%">
            <Box grow position="relative" minHeight={280}>
              <div className={classes.card}>
                <Text align="center" variant="XL / Medium">
                  {currentCard ? getCardText(currentCard, courseLang).text : ''}
                </Text>
              </div>
            </Box>
            {recognitionAvailable ? (
              <Stack horizontalAlign="center" spacing="s">
                <button
                  aria-label={recognizing ? 'Остановить запись' : 'Проверить произношение'}
                  className={`${classes.micButton} ${
                    recognizing ? classes.micButtonListening : ''
                  }`}
                  disabled={advancing}
                  type="button"
                  onClick={handleVoiceCheck}
                >
                  <IconMicrophone fontSize={32} />
                </button>
                {recognizing ? (
                  <Text align="center" color="contrast-secondary" variant="S / Medium">
                    {asrStatus?.downloading ? (
                      `Загружаю распознавание речи… ${Math.round(asrStatus.progress * 100)}%`
                    ) : (
                      <>
                        говорите
                        <span className={classes.listeningDots}>
                          <span className={classes.listeningDot}>.</span>
                          <span className={classes.listeningDot}>.</span>
                          <span className={classes.listeningDot}>.</span>
                        </span>
                      </>
                    )}
                  </Text>
                ) : status ? (
                  <FormHelperText rounded variant={status.kind}>
                    {status.message}
                  </FormHelperText>
                ) : null}
              </Stack>
            ) : (
              <Text align="center" color="contrast-secondary" variant="S / Medium">
                Распознавание речи недоступно на устройстве
              </Text>
            )}
          </Stack>
        )}
      </Box>
      {finished && passed ? <Confetti /> : null}
    </Box>
  )
}
