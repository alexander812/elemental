import { createEffect, createEvent, createStore, sample } from 'effector'

import type { LanguageCode } from '../../../lib/languages'
import { uid } from '../../../lib/uid'
import { scanText } from '../../../transport/ocr'
import { translateText } from '../../../transport/translate'

export type WordPair = {
  id: string
  original: string
  translation: string
}

const parseWords = (text: string): string[] => {
  const seen = new Set<string>()
  const words: string[] = []

  text.split(/\s+/).forEach((raw) => {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')

    if (!word) return

    const key = word.toLowerCase()

    if (seen.has(key)) return

    seen.add(key)
    words.push(word)
  })

  return words
}

export const textChanged = createEvent<string>()
export const textParsed = createEvent()
export const textEditRequested = createEvent()
export const wordToggled = createEvent<string>()
export const textLangChanged = createEvent<LanguageCode>()
export const pairsCreated = createEvent<'original' | 'translation'>()
export const pairOriginalChanged = createEvent<{ id: string; value: string }>()
export const pairTranslationChanged = createEvent<{ id: string; value: string }>()
export const pairTranslated = createEvent<{
  field: 'original' | 'translation'
  id: string
  value: string
}>()
export const resetTextAdd = createEvent()

export const scanTextFx = createEffect((lang: LanguageCode) => scanText(lang))

export const $scanFailed = createStore(false)
  .on(scanTextFx, () => false)
  .on(scanTextFx.doneData, (_, result) => !result.cancelled && result.text.trim().length === 0)
  .on(scanTextFx.fail, () => true)
  .reset(resetTextAdd)

export const $text = createStore('')
  .on(textChanged, (_, text) => text)
  .on(scanTextFx.doneData, (text, result) => {
    const scanned = result.text.trim()

    if (!scanned) return text

    const current = text.trimEnd()

    return current.length > 0 ? `${current}\n${scanned}` : scanned
  })
  .reset(resetTextAdd)

export const $step = createStore<'input' | 'words'>('input')
  .on(textParsed, () => 'words' as const)
  .on(textEditRequested, () => 'input' as const)
  .reset(resetTextAdd)

export const $textLang = createStore<LanguageCode | null>(null)
  .on(textLangChanged, (_, lang) => lang)
  .reset(resetTextAdd)

export const $words = createStore<string[]>([]).reset(resetTextAdd)

sample({
  clock: textParsed,
  source: $text,
  fn: parseWords,
  target: $words,
})

export const $selected = createStore<string[]>([]).reset(resetTextAdd)

type WordToggle = {
  selected: string[]
  words: string[]
}

const wordToggleComputed = createEvent<WordToggle>()

sample({
  clock: wordToggled,
  source: { selected: $selected, words: $words },
  fn: ({ selected, words }, word) => {
    if (!selected.includes(word)) {
      return { selected: [...selected, word], words }
    }

    return {
      selected: selected.filter((item) => item !== word),
      words: word.includes(' ')
        ? words.flatMap((item) => (item === word ? word.split(' ') : [item]))
        : words,
    }
  },
  target: wordToggleComputed,
})

$words.on(wordToggleComputed, (_, result) => result.words)

$selected.on(wordToggleComputed, (_, result) => result.selected)

sample({
  clock: textParsed,
  source: { selected: $selected, text: $text },
  fn: ({ selected, text }) => {
    const words = parseWords(text)

    return selected.filter((word) => words.includes(word))
  },
  target: $selected,
})

type WordsMerge = {
  merged: string
  removed: Set<string>
  nextWords: string[]
}

const mergeWordsInRange = (words: string[], passed: string[]): WordsMerge | null => {
  const indices = passed
    .map((word) => words.indexOf(word))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)

  if (indices.length < 2) return null

  const first = indices[0]
  const last = indices[indices.length - 1]

  if (first === last) return null

  const removedWords = words.slice(first, last + 1)
  const merged = removedWords.join(' ')

  return {
    merged,
    removed: new Set(removedWords),
    nextWords: [...words.slice(0, first), merged, ...words.slice(last + 1)],
  }
}

export const wordsMerged = createEvent<string[]>()

const wordsMergeComputed = createEvent<WordsMerge | null>()

sample({
  clock: wordsMerged,
  source: $words,
  fn: (words, passed) => mergeWordsInRange(words, passed),
  target: wordsMergeComputed,
})

$words.on(wordsMergeComputed, (words, result) => result?.nextWords ?? words)

$selected.on(wordsMergeComputed, (selected, result) =>
  result ? [...selected.filter((word) => !result.removed.has(word)), result.merged] : selected
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
  .reset(resetTextAdd)

sample({
  clock: pairsCreated,
  source: $selected,
  fn: (words, field) =>
    words.map((word) => ({
      id: uid(),
      original: field === 'original' ? word : '',
      translation: field === 'translation' ? word : '',
    })),
  target: $pairs,
})

export const translateAllFx = createEffect(
  async ({
    originalLang,
    pairs,
    translationLang,
  }: {
    originalLang: LanguageCode
    pairs: WordPair[]
    translationLang: LanguageCode
  }) => {
    let failed = false

    for (const pair of pairs) {
      const original = pair.original.trim()
      const translation = pair.translation.trim()

      if (!original && !translation) continue

      try {
        if (original) {
          const value = await translateText(original, originalLang, translationLang)
          pairTranslated({ field: 'translation', id: pair.id, value })
        } else {
          const value = await translateText(translation, translationLang, originalLang)
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
