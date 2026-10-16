import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { IconBookOpen, IconSettings, IconViewList } from '@elemental/icons'
import { BottomSheetProvider } from '@elemental/ui-kit'

import { DataView } from '../features/backup/ui/DataView'
import { ExportView } from '../features/backup/ui/ExportView'
import { $appReady } from '../features/boot/store'
import { CardCreateView } from '../features/card-create/ui/CardCreateView'
import { CardsRestoreView } from '../features/cards/ui/CardsRestoreView'
import { CardsView } from '../features/cards/ui/CardsView'
import { KnowledgeView } from '../features/knowledge/ui/KnowledgeView'
import { OnboardingView } from '../features/onboarding/ui/OnboardingView'
import { $onboardingOpened, $taskOnboardingOpened } from '../features/onboarding/store'
import { BurnNotice } from '../features/progression/ui/BurnNotice'
import { LevelUpNotice } from '../features/progression/ui/LevelUpNotice'
import { ProgressView } from '../features/progression/ui/ProgressView'
import { $activeBurn, $levelUp, burnCheck } from '../features/progression/store'
import { $progressionEnabled } from '../features/theme/store'
import { ChecksView } from '../features/settings/ui/ChecksView'
import { AboutView } from '../features/settings/ui/AboutView'
import { LanguageView } from '../features/settings/ui/LanguageView'
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
import { CourseSearchView } from '../features/course-search/ui/CourseSearchView'
import { CoursesView } from '../features/courses/ui/CoursesView'
import { LessonCreateView } from '../features/lessons/ui/LessonCreateView'
import { LessonsView } from '../features/lessons/ui/LessonsView'
import { SetCreateView } from '../features/set-create/ui/SetCreateView'
import { MenuView } from '../features/settings/ui/MenuView'
import { ThemeView } from '../features/settings/ui/ThemeView'
import { RecognitionView } from '../features/recognition/ui/RecognitionView'
import { SetsView } from '../features/sets/ui/SetsView'
import { SetTextView } from '../features/set-text/ui/SetTextView'
import { TextAddView } from '../features/text-add/ui/TextAddView'
import { WordsTranslateView } from '../features/text-add/ui/WordsTranslateView'
import { VoicesView } from '../features/voices/ui/VoicesView'
import { RecognitionSheet } from '../shared/ui/RecognitionSheet'
import { Toast } from '../shared/ui/Toast'

import classes from './AppLayout.module.pcss'

function renderScreen(screen: Screen): ReactNode {
  switch (screen.name) {
    case 'courses':
      return <CoursesView />
    case 'progress':
      return <ProgressView />
    case 'course-create':
      return <CourseCreateView courseId={screen.courseId} />
    case 'course-search':
      return <CourseSearchView />
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
    case 'set-intro':
      return <SetTextView key={screen.setId} setId={screen.setId} welcome />
    case 'set-text':
      return 'setId' in screen ? (
        <SetTextView key={screen.setId} setId={screen.setId} />
      ) : (
        <SetTextView key="draft" draft={screen.draft} />
      )
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
    case 'language':
      return <LanguageView />
    case 'voices':
      return <VoicesView />
    case 'knowledge':
      return <KnowledgeView key={screen.videoId} videoId={screen.videoId} />
    case 'recognition':
      return <RecognitionView />
    case 'checks':
      return <ChecksView />
    case 'about':
      return <AboutView />
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
    name === 'language' ||
    name === 'voices' ||
    name === 'knowledge' ||
    name === 'recognition' ||
    name === 'checks' ||
    name === 'about' ||
    name === 'data' ||
    name === 'export'
  )
}

function AppFooter() {
  const screen = useUnit($screen)

  const isMenuActive = isSettingsScreen(screen.name)
  const isCoursesActive = screen.name === 'courses' || screen.name === 'progress'
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
        <FormattedMessage id="nav_courses" defaultMessage="Courses" />
      </button>
      <button
        className={`${classes.footerButton} ${isLessonsActive ? classes.footerButtonActive : ''}`}
        type="button"
        onClick={handleLessons}
      >
        <IconBookOpen fontSize={24} />
        <FormattedMessage id="nav_lessons" defaultMessage="Lessons" />
      </button>
      <button
        className={`${classes.footerButton} ${isMenuActive ? classes.footerButtonActive : ''}`}
        type="button"
        onClick={handleMenu}
      >
        <IconSettings fontSize={24} />
        <FormattedMessage id="nav_settings" defaultMessage="Settings" />
      </button>
    </div>
  )
}

export function AppLayout() {
  const stack = useUnit($stack)
  const screen = useUnit($screen)
  const transition = useUnit($transition)
  const appReady = useUnit($appReady)
  const onboardingOpened = useUnit($onboardingOpened)
  const taskOnboardingOpened = useUnit($taskOnboardingOpened)
  const activeBurn = useUnit($activeBurn)
  const levelUp = useUnit($levelUp)
  const progressionEnabled = useUnit($progressionEnabled)

  const mainRef = useRef<HTMLElement>(null)

  const entering = transition.kind === 'push'
  const leavingScreen = transition.kind === 'pop' ? transition.screen : null
  const isTaskScreen = screen.name === 'set-intro' || screen.name === 'cards'

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [screen])

  useEffect(() => {
    if (!leavingScreen) return

    const timer = setTimeout(() => transitionEnded(), 400)

    return () => clearTimeout(timer)
  }, [leavingScreen])

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) burnCheck()
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <div className={classes.app}>
      <BottomSheetProvider>
        <main className={classes.main} ref={mainRef}>
          <div
            key={`${stack.length}-${screen.name}`}
            className={`${classes.screen} ${entering ? classes.screenEntering : ''}`}
          >
            {renderScreen(screen)}
          </div>
          {/* inert: the leaving screen is a copy popped from the stack, it must not
              capture focus (autoFocus reopened the keyboard) */}
          {leavingScreen && (
            <div
              className={classes.screenExiting}
              inert
              onAnimationEnd={() => transitionEnded()}
            >
              {renderScreen(leavingScreen)}
            </div>
          )}
        </main>
        <AppFooter />
        <RecognitionSheet onOpenSettings={() => pushScreen({ name: 'recognition' })} />
        <Toast />
        {appReady && !onboardingOpened && progressionEnabled && activeBurn ? <BurnNotice /> : null}
        {appReady && !onboardingOpened && progressionEnabled && levelUp !== null ? (
          <LevelUpNotice />
        ) : null}
        {appReady && onboardingOpened ? <OnboardingView /> : null}
        {appReady && !onboardingOpened && taskOnboardingOpened && isTaskScreen ? (
          <OnboardingView variant="task" />
        ) : null}
      </BottomSheetProvider>
    </div>
  )
}
