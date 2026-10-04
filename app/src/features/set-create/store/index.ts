import { createEffect } from 'effector'

import type { LanguageCode } from '../../../lib/languages'
import { translateText } from '../../../transport/translate'

export type TranslatePair = {
  id: string
  original: string
  translation: string
}

export type TranslatedPair = {
  field: 'original' | 'translation'
  id: string
  value: string
}

export const translatePairsFx = createEffect(
  async ({
    originalLang,
    pairs,
    translationLang,
  }: {
    originalLang: LanguageCode
    pairs: TranslatePair[]
    translationLang: LanguageCode
  }) => {
    let failed = false
    const results: TranslatedPair[] = []

    for (const pair of pairs) {
      const original = pair.original.trim()
      const translation = pair.translation.trim()

      if (!original && !translation) continue

      try {
        if (original) {
          const value = await translateText(original, originalLang, translationLang)
          results.push({ field: 'translation', id: pair.id, value })
        } else {
          const value = await translateText(translation, translationLang, originalLang)
          results.push({ field: 'original', id: pair.id, value })
        }
      } catch {
        failed = true
      }
    }

    return { failed, results }
  }
)
