import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { useUnit } from 'effector-react'

import { IconBookOpen, IconSettings, IconViewList } from '@elemental/icons'

import { DataView } from '../features/backup/ui/DataView'
import { ExportView } from '../features/backup/ui/ExportView'
import { CardCreateView } from '../features/card-create/ui/CardCreateView'
import { CardsRestoreView } from '../features/cards/ui/CardsRestoreView'
import { CardsView } from '../features/cards/ui/CardsView'
import { ChecksView } from '../features/settings/ui/ChecksView'
import {
  goToLessons,
  goToRoot,
  pushScreen,
  transitionEnded,
  $screen,
  $stack,
  $transition,
} from '../features/navigation/store'
import type { Screen } from '../features/navigation/store'
import { CourseCreateView } from '../features/courses/ui/CourseCreateView'
import { CoursesView } from '../features/courses/ui/CoursesView'
import { LessonCreateView } from '../features/lessons/ui/LessonCreateView'
import { LessonsView } from '../features/lessons/ui/LessonsView'
import { SetCreateView } from '../features/set-create/ui/SetCreateView'
import { MenuView } from '../features/settings/ui/MenuView'
import { ThemeView } from '../features/settings/ui/ThemeView'
import { SetsView } from '../features/sets/ui/SetsView'
import { TextAddView } from '../features/text-add/ui/TextAddView'
import { WordsTranslateView } from '../features/text-add/ui/WordsTranslateView'
import { VoicesView } from '../features/voices/ui/VoicesView'

import classes from './AppLayout.module.pcss'

function renderScreen(screen: Screen): ReactNode {
  switch (screen.name) {
    case 'courses':
      return <CoursesView />
    case 'course-create':
      return <CourseCreateView courseId={screen.courseId} />
    case 'lessons':
      return <LessonsView />
    case 'lesson':
      return <SetsView key={screen.lessonId} lessonId={screen.lessonId} />
    case 'lesson-create':
      return (
        <LessonCreateView
          key={screen.lessonId ?? screen.courseId}
          courseId={screen.courseId}
          lessonId={screen.lessonId}
        />
      )
    case 'set-create':
      return <SetCreateView lessonId={screen.lessonId} setId={screen.setId} />
    case 'cards':
      return <CardsView key={screen.setId} setId={screen.setId} />
    case 'card-create':
      return <CardCreateView cardId={screen.cardId} setId={screen.setId} />
    case 'cards-restore':
      return <CardsRestoreView key={screen.setId} setId={screen.setId} />
    case 'text-add':
      return 'setId' in screen ? (
        <TextAddView key={screen.setId} setId={screen.setId} />
      ) : (
        <TextAddView key="draft" draft={screen.draft} />
      )
    case 'words-translate':
      return <WordsTranslateView key={screen.setId} setId={screen.setId} />
    case 'settings':
      return <MenuView />
    case 'theme':
      return <ThemeView />
    case 'voices':
      return <VoicesView />
    case 'checks':
      return <ChecksView />
    case 'data':
      return <DataView />
    case 'export':
      return <ExportView />
  }
}

function isSettingsScreen(name: Screen['name']): boolean {
  return (
    name === 'settings' ||
    name === 'theme' ||
    name === 'voices' ||
    name === 'checks' ||
    name === 'data' ||
    name === 'export'
  )
}

function AppFooter() {
  const screen = useUnit($screen)

  const isMenuActive = isSettingsScreen(screen.name)
  const isCoursesActive = screen.name === 'courses'
  const isLessonsActive = !isMenuActive && !isCoursesActive

  const handleCourses = () => {
    if (screen.name === 'courses') return
    goToRoot()
  }

  const handleLessons = () => {
    if (screen.name === 'lessons') return
    goToLessons()
  }

  const handleMenu = () => {
    if (isSettingsScreen(screen.name)) return
    pushScreen({ name: 'settings' })
  }

  return (
    <div className={classes.footer}>
      <button
        className={`${classes.footerButton} ${isCoursesActive ? classes.footerButtonActive : ''}`}
        type="button"
        onClick={handleCourses}
      >
        <IconViewList fontSize={24} />
        Курсы
      </button>
      <button
        className={`${classes.footerButton} ${isLessonsActive ? classes.footerButtonActive : ''}`}
        type="button"
        onClick={handleLessons}
      >
        <IconBookOpen fontSize={24} />
        Уроки
      </button>
      <button
        className={`${classes.footerButton} ${isMenuActive ? classes.footerButtonActive : ''}`}
        type="button"
        onClick={handleMenu}
      >
        <IconSettings fontSize={24} />
        Настройки
      </button>
    </div>
  )
}

export function AppLayout() {
  const stack = useUnit($stack)
  const screen = useUnit($screen)
  const transition = useUnit($transition)

  const mainRef = useRef<HTMLElement>(null)

  const entering = transition.kind === 'push'
  const leavingScreen = transition.kind === 'pop' ? transition.screen : null

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [screen])

  useEffect(() => {
    if (!leavingScreen) return

    const timer = setTimeout(() => transitionEnded(), 400)

    return () => clearTimeout(timer)
  }, [leavingScreen])

  return (
    <div className={classes.app}>
      <main className={classes.main} ref={mainRef}>
        <div
          key={`${stack.length}-${screen.name}`}
          className={`${classes.screen} ${entering ? classes.screenEntering : ''}`}
        >
          {renderScreen(screen)}
        </div>
        {leavingScreen && (
          <div className={classes.screenExiting} onAnimationEnd={() => transitionEnded()}>
            {renderScreen(leavingScreen)}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  )
}
