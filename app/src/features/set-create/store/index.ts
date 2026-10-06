import { createEffect, createEvent, createStore } from 'effector'

import { DEFAULT_ORIGINAL_LANG, DEFAULT_TRANSLATION_LANG } from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import { uid } from '../../../lib/uid'
import { translateText } from '../../../transport/translate'

export type TranslatePair = {
  id: string
  original: string
  translation: string
}

export type PairDraft = TranslatePair & {
  cardId?: string
}

export type TranslatedPair = {
  field: 'original' | 'translation'
  id: string
  value: string
}

export const createEmptyPair = (): PairDraft => ({ id: uid(), original: '', translation: '' })

export const draftInitialized = createEvent<{
  name: string
  originalLang: LanguageCode
  translationLang: LanguageCode
  pairs: PairDraft[]
}>()

export const draftNameChanged = createEvent<string>()

export const draftLanguagesChanged = createEvent<{
  originalLang: LanguageCode
  translationLang: LanguageCode
  pairs: PairDraft[]
}>()

export const draftPairChanged = createEvent<{
  id: string
  field: 'original' | 'translation'
  value: string
}>()

export const draftPairAdded = createEvent()
export const draftWordsAdded = createEvent<{ field: 'original' | 'translation'; words: string[] }>()
export const draftPairsTranslated = createEvent<TranslatedPair[]>()
export const draftReset = createEvent()

export const restoreDraft = createEvent<{
  name: string
  originalLang: LanguageCode
  translationLang: LanguageCode
  pairs: PairDraft[]
}>()

export const $draftName = createStore('')
  .on(draftInitialized, (_, draft) => draft.name)
  .on(draftNameChanged, (_, name) => name)
  .on(restoreDraft, (_, draft) => draft.name)
  .reset(draftReset)

export const $draftOriginalLang = createStore<LanguageCode>(DEFAULT_ORIGINAL_LANG)
  .on(draftInitialized, (_, draft) => draft.originalLang)
  .on(draftLanguagesChanged, (_, draft) => draft.originalLang)
  .on(restoreDraft, (_, draft) => draft.originalLang)
  .reset(draftReset)

export const $draftTranslationLang = createStore<LanguageCode>(DEFAULT_TRANSLATION_LANG)
  .on(draftInitialized, (_, draft) => draft.translationLang)
  .on(draftLanguagesChanged, (_, draft) => draft.translationLang)
  .on(restoreDraft, (_, draft) => draft.translationLang)
  .reset(draftReset)

export const $draftPairs = createStore<PairDraft[]>([createEmptyPair()])
  .on(draftInitialized, (_, draft) => draft.pairs)
  .on(draftLanguagesChanged, (_, draft) => draft.pairs)
  .on(draftPairChanged, (pairs, { id, field, value }) =>
    pairs.map((pair) => (pair.id === id ? { ...pair, [field]: value } : pair))
  )
  .on(draftPairAdded, (pairs) => [...pairs, createEmptyPair()])
  .on(draftPairsTranslated, (pairs, results) =>
    pairs.map((pair) => {
      const result = results.find((item) => item.id === pair.id)

      return result ? { ...pair, [result.field]: result.value } : pair
    })
  )
  .on(restoreDraft, (_, draft) => draft.pairs)
  .on(draftWordsAdded, (pairs, { field, words }) => [
    ...pairs.filter((pair) => pair.original.trim().length > 0 || pair.translation.trim().length > 0),
    ...words.map((word) =>
      field === 'original'
        ? { id: uid(), original: word, translation: '' }
        : { id: uid(), original: '', translation: word }
    ),
  ])
  .reset(draftReset)

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
