import { createEvent, createStore } from 'effector'

import { closeTopBottomSheet } from '@elemental/ui-kit'

import { suppressNextGhostClick } from '../../../lib/ghostClick'
import type { LanguageCode } from '../../../lib/languages'

export type TextAddDraft = {
  courseLang: LanguageCode
}

export type Screen =
  | { name: 'courses' }
  | { name: 'course-create'; courseId?: string }
  | { name: 'course-search' }
  | { name: 'lessons' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'lesson-create'; lessonId?: string; courseId?: string }
  | { name: 'set-create'; setId?: string; lessonId?: string }
  | { name: 'cards'; setId: string }
  | { name: 'set-intro'; setId: string }
  | { name: 'set-text'; setId: string }
  | { name: 'set-text'; draft: TextAddDraft }
  | { name: 'card-create'; setId: string; cardId?: string }
  | { name: 'cards-restore'; setId: string }
  | { name: 'text-add'; setId: string }
  | { name: 'text-add'; draft: TextAddDraft }
  | { name: 'words-translate'; setId: string }
  | { name: 'settings' }
  | { name: 'theme' }
  | { name: 'language' }
  | { name: 'voices' }
  | { name: 'checks' }
  | { name: 'data' }
  | { name: 'export' }

export type Transition = { kind: 'none' } | { kind: 'push' } | { kind: 'pop'; screen: Screen }

export const pushScreen = createEvent<Screen>()
export const popScreen = createEvent()
export const replaceScreen = createEvent<Screen>()
export const popTo = createEvent<Screen['name']>()
export const goToRoot = createEvent()
export const goToLessons = createEvent()
export const transitionEnded = createEvent()
export const restoreNav = createEvent<Screen[]>()

type NavState = {
  stack: Screen[]
  transition: Transition
}

const INITIAL_STACK: Screen[] = [{ name: 'courses' }]

export const $nav = createStore<NavState>({
  stack: INITIAL_STACK,
  transition: { kind: 'none' },
})
  .on(pushScreen, (state, screen) => ({
    stack: [...state.stack, screen],
    transition: { kind: 'push' },
  }))
  .on(popScreen, (state) => {
    if (state.stack.length <= 1) return state

    return {
      stack: state.stack.slice(0, -1),
      transition: { kind: 'pop', screen: state.stack[state.stack.length - 1] },
    }
  })
  .on(replaceScreen, (state, screen) => {
    if (state.stack.length === 0) return state

    return {
      stack: [...state.stack.slice(0, -1), screen],
      transition: { kind: 'push' },
    }
  })
  .on(popTo, (state, name) => {
    let index = -1

    for (let i = state.stack.length - 1; i >= 0; i -= 1) {
      if (state.stack[i].name === name) {
        index = i
        break
      }
    }

    if (index < 0 || index === state.stack.length - 1) return state

    return {
      stack: state.stack.slice(0, index + 1),
      transition: { kind: 'pop', screen: state.stack[state.stack.length - 1] },
    }
  })
  .on(goToRoot, (state) => {
    if (state.stack.length <= 1 && state.stack[0].name === 'courses') return state

    return {
      stack: INITIAL_STACK,
      transition:
        state.stack.length > 1
          ? { kind: 'pop', screen: state.stack[state.stack.length - 1] }
          : { kind: 'push' },
    }
  })
  .on(goToLessons, (state) => {
    if (state.stack.length === 1 && state.stack[0].name === 'lessons') return state

    return {
      stack: [{ name: 'lessons' }],
      transition: { kind: 'push' },
    }
  })
  .on(transitionEnded, (state) => ({ ...state, transition: { kind: 'none' } }))
  .on(restoreNav, (_, stack) => ({ stack, transition: { kind: 'none' } }))

export const $stack = $nav.map((state) => state.stack)
export const $screen = $nav.map((state) => state.stack[state.stack.length - 1])
export const $transition = $nav.map((state) => state.transition)
export const $canGoBack = $stack.map((stack) => stack.length > 1)

export const handleAndroidBack = (): boolean => {
  if (closeTopBottomSheet()) return true

  if (!$canGoBack.getState()) return false

  popScreen()

  return true
}

pushScreen.watch(suppressNextGhostClick)
popScreen.watch(suppressNextGhostClick)
replaceScreen.watch(suppressNextGhostClick)
popTo.watch(suppressNextGhostClick)
goToRoot.watch(suppressNextGhostClick)
goToLessons.watch(suppressNextGhostClick)
