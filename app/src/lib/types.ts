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
  swapped: boolean
  examPassed: boolean
  texts: CardTexts
  cards: Card[]
}

export interface Lesson {
  id: string
  courseId: string
  name: string
  order: number
}

export type CourseLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate'

export interface Course {
  id: string
  name: string
  description: string
  order: number
  lang: LanguageCode
  level?: CourseLevel
}

export type ThemeName = 'dark' | 'light'

export interface Settings {
  theme: ThemeName
  userLang: LanguageCode
  learnAfterChecks: boolean
}
