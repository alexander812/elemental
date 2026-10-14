import { useEffect } from 'react'
import type { AnimationEvent as ReactAnimationEvent } from 'react'

import { useUnit } from 'effector-react'

import { hintShown, $onboardingHints } from '../store'
import type { OnboardingHint } from '../store'

import classes from './shake.module.pcss'

const SHAKE_DURATION_MS = 700

export type ShakeProps = {
  className?: string
  onAnimationEnd?: (event: ReactAnimationEvent<HTMLElement>) => void
}

export function useShakeHint(hint: OnboardingHint, active: boolean): ShakeProps {
  const hints = useUnit($onboardingHints)
  const pending = active && !hints[hint]

  useEffect(() => {
    if (!pending) return

    const timer = window.setTimeout(() => hintShown(hint), SHAKE_DURATION_MS + 100)

    return () => window.clearTimeout(timer)
  }, [pending, hint])

  if (!pending) return {}

  return {
    className: classes.shake,
    onAnimationEnd: (event) => {
      if (event.target === event.currentTarget) hintShown(hint)
    },
  }
}
