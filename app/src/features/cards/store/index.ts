import { createEffect, createEvent, createStore, sample } from 'effector';

import type { LanguageCode } from '../../../lib/languages';
import { isNativeBridgeAvailable } from '../../../lib/nativeBridge';
import type { PronunciationAssessment } from '../../../lib/pronunciation';
import { assessPronunciation } from '../../../lib/pronunciation';
import type { AsrStatus } from '../../../transport/recognition';
import { fetchAsrStatus, recognize } from '../../../transport/recognition';
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

export const asrStatusReceived = createEvent<AsrStatus | null>();

export const $asrStatus = createStore<AsrStatus | null>(null).on(
  asrStatusReceived,
  (_, status) => status,
);

export const recognizeFx = createEffect(async ({ lang, text }: RecognizePayload) => {
  const polling = isNativeBridgeAvailable()
    ? setInterval(() => {
        fetchAsrStatus()
          .then((status) => asrStatusReceived(status))
          .catch(() => asrStatusReceived(null));
      }, 800)
    : null;

  try {
    const result = await recognize(lang);

    return assessPronunciation(text, result.transcript);
  } finally {
    if (polling) clearInterval(polling);
    asrStatusReceived(null);
  }
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
