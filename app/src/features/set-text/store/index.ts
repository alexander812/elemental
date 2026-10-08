import { createEffect, createEvent, createStore, sample } from 'effector'

import type { LanguageCode } from '../../../lib/languages'
import { uid } from '../../../lib/uid'
import { mergeWordsInRange } from '../../../lib/words'
import type { WordsMerge } from '../../../lib/words'
import { translateText } from '../../../transport/translate'
import { updateSetTextFx } from '../../sets/store'
import { pairsReplaced } from '../../text-add/store'
import type { WordPair } from '../../text-add/store'

export type SetTextTab = 'user' | 'course'

export const segmentsLoaded = createEvent<string[]>()
export const tabChanged = createEvent<SetTextTab>()
export const wordToggled = createEvent<string>()
export const wordsMerged = createEvent<string[]>()
export const createCardsClicked = createEvent()
export const resetSetText = createEvent()

export const $tab = createStore<SetTextTab>('user')
  .on(tabChanged, (_, tab) => tab)
  .reset(resetSetText)

export const $words = createStore<string[]>([])
  .on(segmentsLoaded, (_, words) => words)
  .reset(resetSetText)

export const $selected = createStore<string[]>([])
  .on(segmentsLoaded, (selected, words) => selected.filter((word) => words.includes(word)))
  .on(tabChanged, () => [])
  .reset(resetSetText)

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

export const translateSegmentFx = createEffect(
  ({ from, text, to }: { from: LanguageCode; text: string; to: LanguageCode }) =>
    translateText(text, from, to)
)

export const translateSetTextFx = createEffect(
  async ({
    from,
    setId,
    text,
    to,
  }: {
    from: LanguageCode
    setId: string
    text: string
    to: LanguageCode
  }) => {
    const translated = await translateText(text, from, to)

    await updateSetTextFx({ lang: to, setId, text: translated })

    return translated
  }
)

sample({
  clock: createCardsClicked,
  source: { selected: $selected, tab: $tab },
  fn: ({ selected, tab }): WordPair[] =>
    selected.map((word) => ({
      id: uid(),
      original: tab === 'user' ? word : '',
      translation: tab === 'course' ? word : '',
    })),
  target: pairsReplaced,
})
