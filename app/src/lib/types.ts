import type { LanguageCode } from './languages'

export type CardTexts = Partial<Record<LanguageCode, string>>

export interface Card {
  id: string
  texts: CardTexts
  learned: boolean
  deleted: boolean
  voiceCheck: boolean | null
  writeCheck: boolean | null
}

export interface CardSet {
  id: string
  name: string
  active: boolean
  order: number
  originalLang: LanguageCode
  translationLang: LanguageCode
  cards: Card[]
}

export type ThemeName = 'dark' | 'light'

export interface Settings {
  theme: ThemeName
  originalLang: LanguageCode
  translationLang: LanguageCode
  learnAfterChecks: boolean
}
