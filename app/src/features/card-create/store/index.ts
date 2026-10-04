import { createEffect } from 'effector'

import type { LanguageCode } from '../../../lib/languages'
import { translateText } from '../../../transport/translate'

export const translateFx = createEffect(
  (payload: { text: string; from: LanguageCode; to: LanguageCode }) =>
    translateText(payload.text, payload.from, payload.to)
)
