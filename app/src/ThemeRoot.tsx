import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { IconsProvider, ThemeProvider } from '@elemental/ui-kit'
import { useUnit } from 'effector-react'
import { IntlProvider, ReactIntlErrorCode } from 'react-intl'

import { fetchCoursesFx } from './features/courses/store'
import { fetchLessonsFx } from './features/lessons/store'
import { fetchProgressionFx } from './features/progression/store'
import { fetchSetsFx } from './features/sets/store'
import { fetchSettingsFx, $theme, $userLang } from './features/theme/store'
import { icons } from './icons'
import { setAnalyticsTraits } from './lib/analytics'
import { FALLBACK_LOCALE, getMessages } from './lib/i18n'

export function ThemeRoot({ children }: { children: ReactNode }) {
  const theme = useUnit($theme)
  const userLang = useUnit($userLang)

  useEffect(() => {
    fetchSettingsFx()
    fetchCoursesFx()
    fetchLessonsFx()
    fetchSetsFx()
    fetchProgressionFx()
  }, [])

  useEffect(() => {
    document.documentElement.lang = userLang
  }, [userLang])

  useEffect(() => {
    setAnalyticsTraits({ theme, ui_lang: userLang })
  }, [theme, userLang])

  return (
    <IntlProvider
      defaultLocale={FALLBACK_LOCALE}
      locale={userLang}
      messages={getMessages(userLang)}
      onError={(error) => {
        if (error.code === ReactIntlErrorCode.MISSING_TRANSLATION) return

        if (import.meta.env.DEV) console.error(error)
      }}
    >
      <ThemeProvider root={document.body} themeName={theme}>
        <IconsProvider icons={icons}>{children}</IconsProvider>
      </ThemeProvider>
    </IntlProvider>
  )
}
