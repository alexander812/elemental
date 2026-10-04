import type { LanguageCode } from './languages'
import type { Card, CardTexts } from './types'

export function remapTexts(
  texts: CardTexts,
  originalLang: LanguageCode,
  translationLang: LanguageCode
): CardTexts {
  return {
    [originalLang]: texts[originalLang] ?? '',
    [translationLang]: texts[translationLang] ?? '',
  }
}

export function getCardText(
  card: Card,
  preferred: LanguageCode
): { lang: LanguageCode; text: string } {
  const text = card.texts[preferred]

  if (text !== undefined) {
    return { lang: preferred, text }
  }

  const fallbackLang = Object.keys(card.texts).find((lang) => card.texts[lang] !== undefined)

  if (fallbackLang) {
    return { lang: fallbackLang, text: card.texts[fallbackLang] as string }
  }

  return { lang: preferred, text: '' }
}
