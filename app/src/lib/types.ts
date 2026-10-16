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
  userLang: LanguageCode
  level?: CourseLevel
}

export type ThemeName = 'dark' | 'light' | 'terracotta' | 'midnight' | 'stone' | 'amethyst'

export interface Settings {
  theme: ThemeName
  userLang: LanguageCode
  learnAfterChecks: boolean
  voiceCheckEnabled: boolean
  writeCheckEnabled: boolean
  debugMode: boolean
  progressionEnabled: boolean
}

export type ProgressionCheckKind = 'voice' | 'write'

export type ProgressionBurn = {
  amount: number
  at: string
  dismissed: boolean
}

export type ProgressionCertificate = {
  courseId: string
  courseName: string
  date: string
}

export type ProgressionCounters = {
  day: string
  dayWords: number
  dayTests: number
  dayErrorless: number
  dayChecks: number
  dayLessons: number
  dayFromText: number
  dayOwnSets: number
  week: string
  weekWords: number
  weekTests: number
  weekChecks: number
  weekLessons: number
  totalWords: number
  totalTests: number
  totalLessons: number
  totalOwnSets: number
  totalCoursesLoaded: number
}

export type ProgressionQuestLog = {
  day: string
  daily: string[]
  dailyDone: string[]
  week: string
  weekly: string[]
  weeklyDone: string[]
  storyDone: string[]
  discoveryDone: string[]
}

export type ProgressionRewarded = {
  cards: string[]
  checks: string[]
  sets: string[]
  errorlessSets: string[]
  lessons: string[]
  courses: string[]
}

export type Progression = {
  schema: number
  xpLocked: number
  xpBurning: number
  coins: number
  lastActiveDay: string | null
  frozenDays: number
  activeDays: string[]
  authoring: { day: string; count: number }
  rewarded: ProgressionRewarded
  counters: ProgressionCounters
  flags: { themeChanged: boolean; knowledgeOpened: boolean }
  quests: ProgressionQuestLog
  burn: ProgressionBurn | null
  pinDay: string | null
  certificates: ProgressionCertificate[]
}
