import { useEffect, useRef, useState } from 'react'

import { useUnit } from 'effector-react'

import { getCardText } from '../../../../../../lib/cards'
import { isAnswerCorrect } from '../../../../../../lib/checks'
import type { LanguageCode } from '../../../../../../lib/languages'
import { isShortSingleWord } from '../../../../../../lib/pronunciation'
import {
  isSilentRecognitionError,
  recognizeErrorText,
} from '../../../../../../lib/recognitionErrors'
import { playError, playSuccess, unlockSounds } from '../../../../../../lib/sounds'
import type { Card as CardModel } from '../../../../../../lib/types'
import { ensureAsrReadyFx } from '../../../../../../shared/ui/RecognitionSheet'
import { vibrateError, vibrateSuccess } from '../../../../../../transport/haptics'
import { updateCardChecksFx } from '../../../../../sets/store'
import {
  $debugMode,
  $learnAfterChecks,
  $voiceCheckEnabled,
  $writeCheckEnabled,
} from '../../../../../theme/store'
import { cancelRecognizeFx, isRecognizeCancelled, recognizeFx, speakFx } from '../../../../store'
import {
  MIC_FLASH_MS,
  modelRecognitionText,
  speakErrorText,
  VOICE_FALLBACK_ATTEMPTS,
  VOICE_FALLBACK_HINT,
} from '../../helpers'
import type { CheckStatus } from '../FlashCard'

type MicFlash = { cardId: string; kind: 'error' | 'success' }

type UseLearnChecksOptions = {
  courseLang: LanguageCode
  scheduleAutoLearn: (cardId: string) => void
  setId: string
  topCard: CardModel | undefined
}

export function useLearnChecks({
  courseLang,
  scheduleAutoLearn,
  setId,
  topCard,
}: UseLearnChecksOptions) {
  const recognizing = useUnit(recognizeFx.pending)
  const learnAfterChecks = useUnit($learnAfterChecks)
  const voiceCheckEnabled = useUnit($voiceCheckEnabled)
  const writeCheckEnabled = useUnit($writeCheckEnabled)
  const debugMode = useUnit($debugMode)

  const [checkStatus, setCheckStatus] = useState<(CheckStatus & { cardId: string }) | null>(null)
  const [listeningCardId, setListeningCardId] = useState<string | null>(null)
  const [micFlash, setMicFlash] = useState<MicFlash | null>(null)
  const [writeFallbackCards, setWriteFallbackCards] = useState<ReadonlySet<string>>(() => new Set())

  const micFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceFailuresRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    return () => {
      if (micFlashTimerRef.current) clearTimeout(micFlashTimerRef.current)
    }
  }, [])

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

  const offerWriteFallback = (cardId: string, expected: string): boolean => {
    if (!isShortSingleWord(expected)) return false

    const failures = (voiceFailuresRef.current.get(cardId) ?? 0) + 1

    voiceFailuresRef.current.set(cardId, failures)

    if (failures < VOICE_FALLBACK_ATTEMPTS) return false

    setWriteFallbackCards((current) => new Set(current).add(cardId))

    return true
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

  const clearCheckStatus = () => {
    setCheckStatus(null)
  }

  const clearMicFlash = (cardId: string) => {
    if (micFlashTimerRef.current) clearTimeout(micFlashTimerRef.current)

    micFlashTimerRef.current = null
    setMicFlash((current) => (current?.cardId === cardId ? null : current))
  }

  const resetChecks = () => {
    if (micFlashTimerRef.current) {
      clearTimeout(micFlashTimerRef.current)
      micFlashTimerRef.current = null
    }

    setMicFlash(null)
    setCheckStatus(null)
  }

  return {
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
  }
}
