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
  lessonId: string
  name: string
  active: boolean
  order: number
  originalLang: LanguageCode
  translationLang: LanguageCode
  cards: Card[]
}

export interface Lesson {
  id: string
  name: string
  order: number
  originalLang: LanguageCode
  translationLang: LanguageCode
}

export type ThemeName = 'dark' | 'light'

export interface Settings {
  theme: ThemeName
  originalLang: LanguageCode
  translationLang: LanguageCode
  learnAfterChecks: boolean
}
