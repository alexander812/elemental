import { createEffect, createEvent, createStore, sample } from 'effector'

import type { LanguageCode } from '../../../lib/languages'
import { callNativeSync } from '../../../lib/nativeBridge'
import { uid } from '../../../lib/uid'
import { mergeWordsInRange, selectedWordTexts } from '../../../lib/words'
import type { WordSegment, WordsMerge } from '../../../lib/words'
import { scanText } from '../../../transport/ocr'
import type { ScanTextResult } from '../../../transport/ocr'
import { translateText } from '../../../transport/translate'

export type WordPair = {
  id: string
  original: string
  translation: string
}

export const textChanged = createEvent<string>()
export const textLangChanged = createEvent<LanguageCode>()
export const editStarted = createEvent<{ lang: LanguageCode; text: string }>()
export const segmentsLoaded = createEvent<WordSegment[]>()
export const wordToggled = createEvent<string>()
export const wordsMerged = createEvent<string[]>()
export const createCardsClicked = createEvent<'original' | 'translation'>()
export const pairsReplaced = createEvent<WordPair[]>()
export const pairOriginalChanged = createEvent<{ id: string; value: string }>()
export const pairTranslationChanged = createEvent<{ id: string; value: string }>()
export const pairTranslated = createEvent<{
  field: 'original' | 'translation'
  id: string
  value: string
}>()
export const resetTextAdd = createEvent()

export const restoreTextAdd = createEvent<{
  text: string
  words: WordSegment[]
  selected: string[]
  textLang: LanguageCode | null
  pairs: WordPair[]
}>()

export const scanTextRecovered = createEvent<{
  ok: boolean
  data?: ScanTextResult
  error?: string
}>()

export const scanTextFx = createEffect((lang: LanguageCode) => scanText(lang))

scanTextFx.finally.watch(() => callNativeSync('finishScan'))

export const $scanFailed = createStore(false)
  .on(scanTextFx, () => false)
  .on(scanTextFx.doneData, (_, result) => !result.cancelled && result.text.trim().length === 0)
  .on(scanTextFx.fail, () => true)
  .on(
    scanTextRecovered,
    (_, payload) =>
      !payload.ok ||
      (!payload.data?.cancelled && (payload.data?.text.trim().length ?? 0) === 0)
  )
  .reset(resetTextAdd)

export const $text = createStore('')
  .on(textChanged, (_, text) => text)
  .on(editStarted, (_, { text }) => text)
  .on(scanTextFx.doneData, (text, result) => result.text.trim() || text)
  .on(scanTextRecovered, (text, payload) => {
    if (!payload.ok || !payload.data || payload.data.cancelled) return text

    return payload.data.text.trim() || text
  })
  .on(restoreTextAdd, (_, snapshot) => snapshot.text)
  .reset(resetTextAdd)

export const $textLang = createStore<LanguageCode | null>(null)
  .on(textLangChanged, (_, lang) => lang)
  .on(editStarted, (_, { lang }) => lang)
  .on(restoreTextAdd, (_, snapshot) => snapshot.textLang)
  .reset(resetTextAdd)

export const $words = createStore<WordSegment[]>([])
  .on(segmentsLoaded, (_, words) => words)
  .on(textLangChanged, () => [])
  .on(restoreTextAdd, (_, snapshot) => snapshot.words)
  .reset(resetTextAdd)

export const $selected = createStore<string[]>([])
  .on(segmentsLoaded, (selected, words) =>
    selected.filter((id) => words.some((segment) => segment.id === id))
  )
  .on(textLangChanged, () => [])
  .on(restoreTextAdd, (_, snapshot) => snapshot.selected)
  .reset(resetTextAdd)

type WordToggle = {
  selected: string[]
  words: WordSegment[]
}

const wordToggleComputed = createEvent<WordToggle>()

sample({
  clock: wordToggled,
  source: { selected: $selected, words: $words },
  fn: ({ selected, words }, id) => {
    const segment = words.find((item) => item.id === id)

    if (!segment) return { selected, words }

    if (!selected.includes(id)) {
      return { selected: [...selected, id], words }
    }

    const nextWords = segment.text.includes(' ')
      ? words.flatMap((item) =>
          item.id === id
            ? item.text
                .split(' ')
                .filter(Boolean)
                .map((part, index) => ({
                  id: index === 0 ? item.id : uid(),
                  text: part,
                  lineBreak: index === 0 && item.lineBreak,
                }))
            : [item]
        )
      : words

    return { selected: selected.filter((item) => item !== id), words: nextWords }
  },
  target: wordToggleComputed,
})

$words.on(wordToggleComputed, (_, result) => result.words)

$selected.on(wordToggleComputed, (_, result) => result.selected)

const wordsMergeComputed = createEvent<WordsMerge | null>()

sample({
  clock: wordsMerged,
  source: $words,
  fn: (words, passed) => mergeWordsInRange(words, passed),
  target: wordsMergeComputed,
})

$words.on(wordsMergeComputed, (words, result) => result?.nextWords ?? words)

$selected.on(wordsMergeComputed, (selected, result) =>
  result
    ? [...selected.filter((id) => !result.removed.has(id)), result.merged.id]
    : selected
)

export const $pairs = createStore<WordPair[]>([])
  .on(pairOriginalChanged, (pairs, { id, value }) =>
    pairs.map((pair) => (pair.id === id ? { ...pair, original: value } : pair))
  )
  .on(pairTranslationChanged, (pairs, { id, value }) =>
    pairs.map((pair) => (pair.id === id ? { ...pair, translation: value } : pair))
  )
  .on(pairTranslated, (pairs, { field, id, value }) =>
    pairs.map((pair) => (pair.id === id ? { ...pair, [field]: value } : pair))
  )
  .on(pairsReplaced, (_, pairs) => pairs)
  .on(restoreTextAdd, (_, snapshot) => snapshot.pairs)
  .reset(resetTextAdd)

sample({
  clock: createCardsClicked,
  source: { selected: $selected, words: $words },
  fn: ({ selected, words }, field): WordPair[] =>
    selectedWordTexts(words, selected).map((word) => ({
      id: uid(),
      original: field === 'original' ? word : '',
      translation: field === 'translation' ? word : '',
    })),
  target: pairsReplaced,
})

export const translateAllFx = createEffect(
  async ({
    courseLang,
    pairs,
    userLang,
  }: {
    courseLang: LanguageCode
    pairs: WordPair[]
    userLang: LanguageCode
  }) => {
    let failed = false

    for (const pair of pairs) {
      const original = pair.original.trim()
      const translation = pair.translation.trim()

      if (!original && !translation) continue

      try {
        if (original) {
          const value = await translateText(original, userLang, courseLang)
          pairTranslated({ field: 'translation', id: pair.id, value })
        } else {
          const value = await translateText(translation, courseLang, userLang)
          pairTranslated({ field: 'original', id: pair.id, value })
        }
      } catch {
        failed = true
      }
    }

    return failed
  }
)

export const $translateFailed = createStore(false)
  .on(translateAllFx, () => false)
  .on(translateAllFx.doneData, (_, failed) => failed)
  .reset(resetTextAdd)
