import { useEffect, useRef, useState } from 'react'

import classes from './shake.module.pcss'
import type { ShakeProps } from './useShakeHint'

const SHAKE_DURATION_MS = 700

export function useDelayedShake(
  active: boolean,
  delayMs: number,
  onFinished?: () => void
): ShakeProps {
  const [shaking, setShaking] = useState(false)
  const onFinishedRef = useRef(onFinished)

  useEffect(() => {
    onFinishedRef.current = onFinished
  })

  useEffect(() => {
    if (!active) return

    let doneTimer: number | null = null

    const startTimer = window.setTimeout(() => {
      setShaking(true)

      doneTimer = window.setTimeout(() => {
        setShaking(false)
        onFinishedRef.current?.()
      }, SHAKE_DURATION_MS + 100)
    }, delayMs)

    return () => {
      window.clearTimeout(startTimer)
      if (doneTimer !== null) window.clearTimeout(doneTimer)
    }
  }, [active, delayMs])

  if (!shaking) return {}

  return {
    className: classes.shake,
    onAnimationEnd: (event) => {
      if (event.target !== event.currentTarget) return

      setShaking(false)
      onFinishedRef.current?.()
    },
  }
}
