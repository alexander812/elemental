import { createEffect, createEvent, createStore, sample } from 'effector';

import type { LanguageCode } from '../../../lib/languages';
import { uid } from '../../../lib/uid';
import { scanText } from '../../../transport/ocr';
import { translateText } from '../../../transport/translate';

export type WordPair = {
  id: string;
  original: string;
  translation: string;
};

const parseWords = (text: string): string[] => {
  const seen = new Set<string>();
  const words: string[] = [];

  text.split(/\s+/).forEach((raw) => {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

    if (!word) return;

    const key = word.toLowerCase();

    if (seen.has(key)) return;

    seen.add(key);
    words.push(word);
  });

  return words;
};

export const textChanged = createEvent<string>();
export const textParsed = createEvent();
export const textEditRequested = createEvent();
export const wordToggled = createEvent<string>();
export const pairsCreated = createEvent();
export const pairOriginalChanged = createEvent<{ id: string; value: string }>();
export const pairTranslationChanged = createEvent<{ id: string; value: string }>();
export const pairTranslated = createEvent<{ id: string; translation: string }>();
export const resetTextAdd = createEvent();

export const scanTextFx = createEffect((lang: LanguageCode) => scanText(lang));

export const $scanFailed = createStore(false)
  .on(scanTextFx, () => false)
  .on(scanTextFx.doneData, (_, result) => !result.cancelled && result.text.trim().length === 0)
  .on(scanTextFx.fail, () => true)
  .reset(resetTextAdd);

export const $text = createStore('')
  .on(textChanged, (_, text) => text)
  .on(scanTextFx.doneData, (text, result) => {
    const scanned = result.text.trim();

    if (!scanned) return text;

    const current = text.trimEnd();

    return current.length > 0 ? `${current}\n${scanned}` : scanned;
  })
  .reset(resetTextAdd);

export const $step = createStore<'input' | 'words'>('input')
  .on(textParsed, () => 'words' as const)
  .on(textEditRequested, () => 'input' as const)
  .reset(resetTextAdd);

export const $words = createStore<string[]>([]).reset(resetTextAdd);

sample({
  clock: textParsed,
  source: $text,
  fn: parseWords,
  target: $words,
});

export const $selected = createStore<string[]>([])
  .on(wordToggled, (selected, word) =>
    selected.includes(word) ? selected.filter((item) => item !== word) : [...selected, word],
  )
  .reset(resetTextAdd);

sample({
  clock: textParsed,
  source: { selected: $selected, text: $text },
  fn: ({ selected, text }) => {
    const words = parseWords(text);

    return selected.filter((word) => words.includes(word));
  },
  target: $selected,
});

export const $pairs = createStore<WordPair[]>([])
  .on(pairOriginalChanged, (pairs, { id, value }) =>
    pairs.map((pair) => (pair.id === id ? { ...pair, original: value } : pair)),
  )
  .on(pairTranslationChanged, (pairs, { id, value }) =>
    pairs.map((pair) => (pair.id === id ? { ...pair, translation: value } : pair)),
  )
  .on(pairTranslated, (pairs, { id, translation }) =>
    pairs.map((pair) => (pair.id === id ? { ...pair, translation } : pair)),
  )
  .reset(resetTextAdd);

sample({
  clock: pairsCreated,
  source: $selected,
  fn: (words) => words.map((word) => ({ id: uid(), original: word, translation: '' })),
  target: $pairs,
});

export const translateAllFx = createEffect(
  async ({ pairs, from, to }: { pairs: WordPair[]; from: LanguageCode; to: LanguageCode }) => {
    let failed = false;

    for (const pair of pairs) {
      const text = pair.original.trim();

      if (!text) continue;

      try {
        const translation = await translateText(text, from, to);
        pairTranslated({ id: pair.id, translation });
      } catch {
        failed = true;
      }
    }

    return failed;
  },
);

export const $translateFailed = createStore(false)
  .on(translateAllFx, () => false)
  .on(translateAllFx.doneData, (_, failed) => failed)
  .reset(resetTextAdd);
