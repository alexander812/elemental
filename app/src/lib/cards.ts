import type { LanguageCode } from './languages'
import type { Card, CardTexts } from './types'

export function remapTexts(
  texts: CardTexts,
  userLang: LanguageCode,
  courseLang: LanguageCode
): CardTexts {
  return {
    [userLang]: texts[userLang] ?? '',
    [courseLang]: texts[courseLang] ?? '',
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
