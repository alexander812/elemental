import { createIntl, createIntlCache } from 'react-intl'
import type { IntlShape } from 'react-intl'

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

const intlCache = createIntlCache()
const intlByLocale = new Map<LanguageCode, IntlShape>()

export const getIntl = (locale: LanguageCode): IntlShape => {
  const cached = intlByLocale.get(locale)

  if (cached) return cached

  const intl = createIntl(
    {
      defaultLocale: FALLBACK_LOCALE,
      locale,
      messages: getMessages(locale),
      onError: () => {},
    },
    intlCache
  )

  intlByLocale.set(locale, intl)

  return intl
}
