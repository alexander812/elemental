import { useEffect, useRef, useState } from 'react'

export function useIncreasePulse(value: number): number {
  const [pulse, setPulse] = useState(0)
  const previousRef = useRef(value)

  useEffect(() => {
    if (value <= previousRef.current) {
      previousRef.current = value
      return undefined
    }

    previousRef.current = value

    const frame = requestAnimationFrame(() => setPulse((current) => current + 1))

    return () => cancelAnimationFrame(frame)
  }, [value])

  return pulse
}
