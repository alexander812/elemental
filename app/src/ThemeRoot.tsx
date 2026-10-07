import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { IconsProvider, ThemeProvider } from '@elemental/ui-kit'
import { useUnit } from 'effector-react'

import { fetchCoursesFx } from './features/courses/store'
import { fetchLessonsFx } from './features/lessons/store'
import { fetchSetsFx } from './features/sets/store'
import { fetchSettingsFx, $theme } from './features/theme/store'
import { icons } from './icons'

export function ThemeRoot({ children }: { children: ReactNode }) {
  const theme = useUnit($theme)

  useEffect(() => {
    fetchSettingsFx()
    fetchCoursesFx()
    fetchLessonsFx()
    fetchSetsFx()
  }, [])

  return (
    <ThemeProvider root={document.body} themeName={theme}>
      <IconsProvider icons={icons}>{children}</IconsProvider>
    </ThemeProvider>
  )
}
