import { createEvent, createStore } from 'effector'

import { load, save } from '../../../lib/storage'

export type OnboardingHint = 'courses-add' | 'first-lesson' | 'test-button'

type OnboardingState = {
  completed: boolean
  hints: Record<OnboardingHint, boolean>
}

const ONBOARDING_KEY = 'onboarding'

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  hints: {
    'courses-add': false,
    'first-lesson': false,
    'test-button': false,
  },
}

const readState = (): OnboardingState => {
  const raw = load<Partial<OnboardingState>>(ONBOARDING_KEY, {})

  return {
    completed: raw.completed === true,
    hints: { ...DEFAULT_STATE.hints, ...raw.hints },
  }
}

const writeState = (state: OnboardingState): OnboardingState => {
  save(ONBOARDING_KEY, state)

  return state
}

export const onboardingCompleted = createEvent()
export const hintShown = createEvent<OnboardingHint>()

export const $onboarding = createStore<OnboardingState>(readState())
  .on(onboardingCompleted, (state) =>
    state.completed ? state : writeState({ ...state, completed: true })
  )
  .on(hintShown, (state, hint) =>
    state.hints[hint] ? state : writeState({ ...state, hints: { ...state.hints, [hint]: true } })
  )

export const $onboardingOpened = $onboarding.map((state) => !state.completed)
export const $onboardingHints = $onboarding.map((state) => state.hints)
