import { createEvent, createStore } from 'effector'

import { suppressNextGhostClick } from '../../../lib/ghostClick'
import type { LanguageCode } from '../../../lib/languages'

export type TextAddDraft = {
  originalLang: LanguageCode
  translationLang: LanguageCode
}

export type Screen =
  | { name: 'sets' }
  | { name: 'set-create'; setId?: string }
  | { name: 'cards'; setId: string }
  | { name: 'card-create'; setId: string; cardId?: string }
  | { name: 'cards-restore'; setId: string }
  | { name: 'text-add'; setId: string }
  | { name: 'text-add'; draft: TextAddDraft }
  | { name: 'words-translate'; setId: string }
  | { name: 'settings' }
  | { name: 'theme' }
  | { name: 'languages' }
  | { name: 'voices' }
  | { name: 'checks' }
  | { name: 'data' }

export type Transition = { kind: 'none' } | { kind: 'push' } | { kind: 'pop'; screen: Screen }

export const pushScreen = createEvent<Screen>()
export const popScreen = createEvent()
export const popTo = createEvent<Screen['name']>()
export const goToRoot = createEvent()
export const transitionEnded = createEvent()
export const restoreNav = createEvent<Screen[]>()

type NavState = {
  stack: Screen[]
  transition: Transition
}

const INITIAL_STACK: Screen[] = [{ name: 'sets' }]

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
    if (state.stack.length <= 1) return state

    return {
      stack: INITIAL_STACK,
      transition: { kind: 'pop', screen: state.stack[state.stack.length - 1] },
    }
  })
  .on(transitionEnded, (state) => ({ ...state, transition: { kind: 'none' } }))
  .on(restoreNav, (_, stack) => ({ stack, transition: { kind: 'none' } }))

export const $stack = $nav.map((state) => state.stack)
export const $screen = $nav.map((state) => state.stack[state.stack.length - 1])
export const $transition = $nav.map((state) => state.transition)
export const $canGoBack = $stack.map((stack) => stack.length > 1)

export const handleAndroidBack = (): boolean => {
  if (!$canGoBack.getState()) return false

  popScreen()

  return true
}

pushScreen.watch(suppressNextGhostClick)
popScreen.watch(suppressNextGhostClick)
popTo.watch(suppressNextGhostClick)
goToRoot.watch(suppressNextGhostClick)
