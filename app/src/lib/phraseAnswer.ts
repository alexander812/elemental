import { normalizeAnswer } from './checks'

export const normalizePhrase = (text: string): string =>
  normalizeAnswer(text.replace(/[’‘]/g, "'").replace(/\bwon't\b/gi, 'will not'))

export const isPhraseCorrect = (answer: string[], words: string[]): boolean =>
  normalizePhrase(answer.join(' ')) === normalizePhrase(words.join(' '))
