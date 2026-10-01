import { createEffect, createStore, sample } from 'effector';

import type { LanguageCode } from '../../../lib/languages';
import type { PronunciationAssessment } from '../../../lib/pronunciation';
import { assessPronunciation } from '../../../lib/pronunciation';
import { recognize } from '../../../transport/recognition';
import { speak } from '../../../transport/speech';

export const speakFx = createEffect((payload: { text: string; lang: LanguageCode }) =>
  speak(payload.text, payload.lang),
);

export const $speakFailed = createStore<Error | null>(null)
  .on(speakFx, () => null)
  .on(speakFx.fail, (_, { error }) => error);

export type RecognitionSide = 'front' | 'back';

export type RecognizePayload = {
  cardId: string;
  lang: LanguageCode;
  side: RecognitionSide;
  text: string;
};

export type PronunciationFeedback = {
  assessment: PronunciationAssessment;
  cardId: string;
  side: RecognitionSide;
};

export const recognizeFx = createEffect(async ({ lang, text }: RecognizePayload) => {
  const result = await recognize(lang);

  return assessPronunciation(text, result.transcript);
});

export const $pronunciation = createStore<PronunciationFeedback | null>(null)
  .on(recognizeFx, () => null)
  .on(recognizeFx.fail, () => null);

sample({
  clock: recognizeFx.done,
  fn: ({ params, result }) => ({
    assessment: result,
    cardId: params.cardId,
    side: params.side,
  }),
  target: $pronunciation,
});

export const $recognizeFailed = createStore<Error | null>(null)
  .on(recognizeFx, () => null)
  .on(recognizeFx.done, () => null)
  .on(recognizeFx.fail, (_, { error }) => error);
