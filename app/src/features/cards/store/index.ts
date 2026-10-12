import { createEffect, createStore, sample } from 'effector'

import type { LanguageCode } from '../../../lib/languages'
import type { PronunciationAssessment } from '../../../lib/pronunciation'
import { assessPronunciation } from '../../../lib/pronunciation'
import { cancelRecognition, recognize } from '../../../transport/recognition'
import { speak } from '../../../transport/speech'

export const speakFx = createEffect((payload: { text: string; lang: LanguageCode }) =>
  speak(payload.text, payload.lang)
)

export const $speakFailed = createStore<Error | null>(null)
  .on(speakFx, () => null)
  .on(speakFx.fail, (_, { error }) => error)

export type RecognitionSide = 'front' | 'back'

export type RecognizePayload = {
  cardId: string
  lang: LanguageCode
  side: RecognitionSide
  text: string
}

export type PronunciationFeedback = {
  assessment: PronunciationAssessment
  cardId: string
  side: RecognitionSide
}

export type RecognitionOutcome = {
  assessment: PronunciationAssessment
  candidates: string[]
}

export const recognizeFx = createEffect(
  async ({ lang, text }: RecognizePayload): Promise<RecognitionOutcome> => {
    const result = await recognize(lang)
    const candidates = [result.transcript, ...result.alternatives]
      .map((candidate) => candidate.trim())
      .filter((candidate, index, all) => candidate.length > 0 && all.indexOf(candidate) === index)

    if (candidates.length === 0) {
      return { assessment: assessPronunciation(text, ''), candidates }
    }

    const assessment = candidates
      .map((candidate) => assessPronunciation(text, candidate))
      .reduce((best, current) => (current.score > best.score ? current : best))

    return { assessment, candidates }
  }
)

export const $pronunciation = createStore<PronunciationFeedback | null>(null)
  .on(recognizeFx, () => null)
  .on(recognizeFx.fail, () => null)

sample({
  clock: recognizeFx.done,
  fn: ({ params, result }) => ({
    assessment: result.assessment,
    cardId: params.cardId,
    side: params.side,
  }),
  target: $pronunciation,
})

export const cancelRecognizeFx = createEffect(() => {
  cancelRecognition()
})

export const isRecognizeCancelled = (error: unknown) =>
  error instanceof Error && (error.message === 'cancelled' || error.message === 'aborted')

export const $recognizeFailed = createStore<Error | null>(null)
  .on(recognizeFx, () => null)
  .on(recognizeFx.done, () => null)
  .on(recognizeFx.fail, (_, { error }) => (isRecognizeCancelled(error) ? null : error))
