import type { LanguageCode } from '../languages'

const messageModules = import.meta.glob('./messages/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, string>>

const localeFromPath = (path: string): LanguageCode =>
  path.replace('./messages/', '').replace('.json', '')

export const FALLBACK_LOCALE: LanguageCode = 'en'

export const UI_MESSAGES: Record<LanguageCode, Record<string, string>> = Object.fromEntries(
  Object.entries(messageModules)
    .map(([path, messages]) => [localeFromPath(path), messages])
    .filter(([locale]) => locale !== FALLBACK_LOCALE)
)

export const getMessages = (locale: LanguageCode): Record<string, string> =>
  UI_MESSAGES[locale] ?? {}

export const getUiLocales = (): LanguageCode[] => Object.keys(UI_MESSAGES).sort()
