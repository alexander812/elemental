import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 600

export function useCountUp(value: number, duration = DURATION_MS): number {
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (displayRef.current === value) return undefined

    let cancelled = false
    const from = displayRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      const frame = requestAnimationFrame(() => {
        if (cancelled) return

        displayRef.current = value
        setDisplay(value)
      })

      return () => {
        cancelled = true
        cancelAnimationFrame(frame)
      }
    }

    const start = performance.now()

    const tick = (nowMs: number) => {
      if (cancelled) return

      const progress = Math.min(1, (nowMs - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(from + (value - from) * eased)

      displayRef.current = next
      setDisplay(next)

      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true

      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  return display
}
