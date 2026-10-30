import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent, MouseEvent } from 'react'

import { suppressNextGhostClick } from '../../../lib/ghostClick'
import { LEAVE_MS } from '../../cards/ui/CardsView/helpers'

type Phase = 'idle' | 'drag' | 'snap' | 'leave' | 'commit'
type Motion = { phase: Phase; origin: number; target: number | null; x: number; width: number }
const resting = (index: number): Motion => ({
  phase: 'idle',
  origin: index,
  target: null,
  x: 0,
  width: 0,
})

export function usePageMotion(
  index: number,
  count: number,
  onMove: (target: number) => Promise<void>,
  onGesture: () => void
) {
  const [motion, setMotion] = useState<Motion>(() => resting(index))
  const visual = useRef(motion)
  const viewportRef = useRef<HTMLDivElement>(null)
  const active = useRef(false)
  const locked = useRef(false)
  const current = useRef({ index, count, onMove, onGesture })
  const animation = useRef<{ raf: number; resolve: (finished: boolean) => void } | null>(null)
  const gesture = useRef<{
    x: number
    y: number
    offset: number
    dx: number
    id: number
    moved: boolean
  } | null>(null)
  const touchedAt = useRef(0)
  const suppressUntil = useRef(0)
  const attachViewport = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node
  }, [])
  useLayoutEffect(() => {
    current.current = { index, count, onMove, onGesture }
  }, [index, count, onMove, onGesture])

  const update = (next: Motion) => {
    const frame = { ...next, x: Math.round(next.x * 64) / 64 }
    visual.current = frame
    if (active.current) setMotion(frame)
  }
  const cancelAnimation = () => {
    const pending = animation.current
    animation.current = null
    if (pending) {
      cancelAnimationFrame(pending.raf)
      pending.resolve(false)
    }
  }
  useEffect(() => {
    active.current = true
    const node = viewportRef.current
    let width = node?.clientWidth
    const observer = node
      ? new ResizeObserver(() => {
          if (node.clientWidth === width) return
          width = node.clientWidth
          if (visual.current.phase !== 'idle' && visual.current.phase !== 'commit') {
            gesture.current = null
            cancelAnimation()
            update(resting(current.current.index))
          }
        })
      : null
    if (node) observer?.observe(node)
    return () => {
      active.current = false
      observer?.disconnect()
      cancelAnimation()
    }
  }, [])

  const tween = (state: Motion, end: number, duration: number): Promise<boolean> => {
    cancelAnimation()
    if (duration <= 0 || state.x === end) {
      update({ ...state, x: end })
      return Promise.resolve(active.current)
    }
    return new Promise((resolve) => {
      const started = performance.now()
      const frame = (time: number) => {
        if (!active.current) {
          animation.current = null
          resolve(false)
          return
        }
        const progress = Math.min(1, (time - started) / duration)
        const eased =
          state.phase === 'snap'
            ? 1 - (1 - progress) ** 3
            : progress * progress * (3 - 2 * progress)
        update({ ...state, x: progress === 1 ? end : state.x + (end - state.x) * eased })
        if (progress < 1) animation.current = { raf: requestAnimationFrame(frame), resolve }
        else {
          animation.current = null
          resolve(true)
        }
      }
      update(state)
      animation.current = { raf: requestAnimationFrame(frame), resolve }
    })
  }

  const snap = async () => {
    const state = visual.current
    if (state.phase === 'idle') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (await tween({ ...state, phase: 'snap' }, 0, reduced ? 0 : 200))
      update(resting(current.current.index))
  }

  const go = async (target: number, animate = true): Promise<boolean> => {
    const state = current.current
    if (!active.current || locked.current || target < 0 || target >= state.count) return false
    state.onGesture()
    gesture.current = null
    locked.current = true
    const width = viewportRef.current?.clientWidth || 390
    const direction = target > state.index ? 1 : -1
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const moving = animate && !reduced && target !== state.index
    const previous = visual.current
    let start =
      previous.phase !== 'idle' && previous.origin === state.index && previous.target === target
        ? previous.x
        : 0
    cancelAnimation()
    try {
      suppressNextGhostClick()
      if (moving) {
        if (previous.origin === state.index && previous.target !== target && previous.x !== 0) {
          if (!(await tween({ ...previous, phase: 'snap' }, 0, 200))) return false
          start = 0
        }
        const end = -direction * width
        const duration = (LEAVE_MS * Math.abs(end - start)) / width
        if (
          !(await tween(
            { phase: 'leave', origin: state.index, target, x: start, width },
            end,
            duration
          ))
        )
          return false
      }
      update({ phase: 'commit', origin: target, target: null, x: 0, width })
      await current.current.onMove(target)
      if (!active.current) return false
      update(resting(target))
      return true
    } catch {
      if (active.current) {
        if (moving)
          await tween(
            { phase: 'snap', origin: state.index, target, x: -direction * width, width },
            0,
            200
          )
        update(resting(state.index))
      }
      return false
    } finally {
      locked.current = false
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!locked.current) suppressUntil.current = 0
    if (
      locked.current ||
      !event.isPrimary ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest('button, a, input')
    )
      return
    if (event.pointerType === 'mouse' && Date.now() - touchedAt.current < 700) return
    current.current.onGesture()
    cancelAnimation()
    const offset = visual.current.phase === 'idle' ? 0 : visual.current.x
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      offset,
      dx: offset,
      id: event.pointerId,
      moved: false,
    }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current
    if (!start || start.id !== event.pointerId || locked.current) return
    const fingerX = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.moved && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(fingerX)) {
      gesture.current = null
      void snap()
      return
    }
    if (Math.abs(fingerX) < 8 && !start.moved) return
    if (!start.moved) event.currentTarget.setPointerCapture(event.pointerId)
    start.moved = true
    const width = viewportRef.current?.clientWidth || 390
    const dx = Math.max(-width, Math.min(width, start.offset + fingerX))
    start.dx = dx
    const state = current.current
    const target = state.index + (dx < 0 ? 1 : -1)
    const valid = target >= 0 && target < state.count
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    update({
      phase: 'drag',
      origin: state.index,
      target: valid ? target : null,
      x: valid && !reduced ? dx : 0,
      width,
    })
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current
    gesture.current = null
    if (event.pointerType === 'touch') touchedAt.current = Date.now()
    if (!start || start.id !== event.pointerId) return
    if (!start.moved) {
      void snap()
      return
    }
    suppressUntil.current = performance.now() + 500
    const state = current.current
    const next = state.index + (start.dx < 0 ? 1 : -1)
    const threshold = Math.min(110, (viewportRef.current?.clientWidth || 390) * 0.28)
    if (Math.abs(start.dx) >= threshold && next >= 0 && next < state.count) void go(next)
    else void snap()
  }
  const onPointerCancel = () => {
    gesture.current = null
    if (!locked.current) void snap()
  }
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (locked.current || performance.now() < suppressUntil.current) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const origin = motion.phase === 'idle' ? index : motion.origin
  const layers = [{ index: origin, x: motion.x }]
  if (motion.target !== null && motion.target !== origin)
    layers.push({
      index: motion.target,
      x: motion.x + (motion.target > origin ? motion.width : -motion.width),
    })
  const visible =
    motion.phase === 'idle' || motion.width === 0
      ? [{ index, x: 0 }]
      : layers.filter((layer) => layer.x < motion.width && layer.x + motion.width > 0)
  return {
    go,
    attachViewport,
    layers: visible,
    phase: motion.phase,
    busy: motion.phase !== 'idle' && motion.phase !== 'snap',
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  }
}
