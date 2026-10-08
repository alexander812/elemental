import { createEffect } from 'effector'

import type { LanguageCode } from '../../../lib/languages'
import { translateText } from '../../../transport/translate'
import { draftTextSaved } from '../../set-create/store'
import { updateSetTextFx } from '../../sets/store'

export const translateSegmentFx = createEffect(
  ({ from, text, to }: { from: LanguageCode; text: string; to: LanguageCode }) =>
    translateText(text, from, to)
)

export const translateSetTextFx = createEffect(
  async ({
    draft,
    from,
    setId,
    text,
    to,
  }: {
    draft?: boolean
    from: LanguageCode
    setId?: string
    text: string
    to: LanguageCode
  }) => {
    const translated = await translateText(text, from, to)

    if (draft || setId === undefined) {
      draftTextSaved({ lang: to, text: translated })
    } else {
      await updateSetTextFx({ lang: to, setId, text: translated })
    }

    return translated
  }
)
