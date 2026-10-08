export interface Language {
  code: string
  name: string
}

export const LANGUAGES_CATALOG: Language[] = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'zh', name: '中文' },
  { code: 'de', name: 'Deutsch' },
]

export type LanguageCode = string

export const DEFAULT_USER_LANG: LanguageCode = 'ru'
export const DEFAULT_COURSE_LANG: LanguageCode = 'en'

export const getLanguageName = (code: LanguageCode, languages: Language[]): string =>
  languages.find((language) => language.code === code)?.name ?? code
