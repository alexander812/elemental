import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'

import { IconEdit, IconTrash } from '@elemental/icons'
import { Card } from '@elemental/ui-kit'

import type { RowReorderRowProps } from './useRowReorder'

import classes from './SwipeRow.module.pcss'

const REVEAL_WIDTH = 144
const LONG_PRESS_MS = 420
const MOVE_SLOP = 10

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

type SwipeRowProps = RowReorderRowProps & {
  children: ReactNode
  color: 'accent' | 'primary'
  deleteLabel: string
  editLabel: string
  onDelete: () => void
  onEdit: () => void
  onTap: () => void
}

export function SwipeRow({
  id,
  index,
  dragging,
  dragOffsetY,
  shift,
  reorderActive,
  settle,
  open,
  children,
  color,
  deleteLabel,
  editLabel,
  onDelete,
  onEdit,
  onOpen,
  onReorderStart,
  onReorderMove,
  onReorderEnd,
  onReorderCancel,
  onTap,
}: SwipeRowProps) {
  const [dx, setDx] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'pending' | 'swipe' | 'reorder'>('idle')
  const [prevOpen, setPrevOpen] = useState(open)
  const startRef = useRef({ x: 0, y: 0, dx: 0, pointerId: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickRef = useRef(false)
  const lastTouchRef = useRef(0)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) setDx(0)
  }

  const handleCardClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    onTap()
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reorderActive) return

    if (event.pointerType === 'touch') {
      lastTouchRef.current = Date.now()
    } else if (event.pointerType === 'mouse') {
      if (event.button !== 0) return
      if (Date.now() - lastTouchRef.current < 700) return
    }

    clearTimer()
    suppressClickRef.current = false
    startRef.current = { x: event.clientX, y: event.clientY, dx, pointerId: event.pointerId }
    setPhase('pending')

    const target = event.currentTarget

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      suppressClickRef.current = true
      setPhase('reorder')
      onReorderStart(id, index, event.pointerId)
      target.setPointerCapture?.(event.pointerId)
    }, LONG_PRESS_MS)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const { x, y, dx: startDx, pointerId } = startRef.current

    if (phase === 'pending') {
      const moveX = event.clientX - x
      const moveY = event.clientY - y
      const vertical = Math.abs(moveY) > Math.abs(moveX)

      if (event.pointerType === 'mouse' && vertical && Math.abs(moveY) > MOVE_SLOP) {
        clearTimer()
        suppressClickRef.current = true
        setPhase('reorder')
        onReorderStart(id, index, event.pointerId)
        event.currentTarget.setPointerCapture?.(event.pointerId)
        onReorderMove(event.pointerId, moveY)
        return
      }

      if (Math.abs(moveX) > MOVE_SLOP && Math.abs(moveX) > Math.abs(moveY)) {
        clearTimer()
        suppressClickRef.current = true
        setPhase('swipe')
        event.currentTarget.setPointerCapture?.(event.pointerId)
      } else if (Math.abs(moveY) > MOVE_SLOP) {
        clearTimer()
        suppressClickRef.current = true
        setPhase('idle')
      }

      return
    }

    if (phase === 'swipe') {
      setDx(clamp(startDx + event.clientX - x, 0, REVEAL_WIDTH))
      return
    }

    if (phase === 'reorder') {
      onReorderMove(pointerId, event.clientY - y)
    }
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const { x, y } = startRef.current
    const moved = Math.abs(event.clientX - x) > MOVE_SLOP || Math.abs(event.clientY - y) > MOVE_SLOP

    if (event.pointerType === 'touch') {
      lastTouchRef.current = Date.now()
    }

    if (phase === 'pending') {
      clearTimer()
      setPhase('idle')

      if (!moved) {
        suppressClickRef.current = true
        onTap()
      }
      return
    }

    if (phase === 'swipe') {
      setPhase('idle')
      const nextDx = dx > REVEAL_WIDTH / 2 ? REVEAL_WIDTH : 0
      setDx(nextDx)
      onOpen(nextDx > 0 ? id : null)
      return
    }

    if (phase === 'reorder') {
      setPhase('idle')
      onReorderEnd(id)
    }
  }

  const handlePointerCancel = () => {
    clearTimer()
    lastTouchRef.current = Date.now()
    suppressClickRef.current = true

    if (phase === 'reorder') {
      setPhase('idle')
      onReorderCancel()
      return
    }

    setPhase('idle')
    setDx(0)
  }

  const isDragged = dragging

  return (
    <div
      className={classes.row}
      style={{
        transform: isDragged ? `translateY(${dragOffsetY}px)` : `translateY(${shift}px)`,
        transition: isDragged || settle ? 'none' : 'transform 160ms ease',
        zIndex: isDragged ? 3 : 1,
      }}
    >
      <div className={classes.reveal} style={{ opacity: clamp(dx / REVEAL_WIDTH, 0, 1) }}>
        <button
          aria-label={deleteLabel}
          className={`${classes.action} ${classes.deleteAction}`}
          type="button"
          onClick={onDelete}
        >
          <IconTrash fontSize={24} />
        </button>
        <button
          aria-label={editLabel}
          className={`${classes.action} ${classes.editAction}`}
          type="button"
          onClick={onEdit}
        >
          <IconEdit fontSize={24} />
        </button>
      </div>
      <div
        className={classes.content}
        style={{
          transform: `translateX(${dx}px) scale(${isDragged ? 1.03 : 1})`,
          transition: isDragged || settle ? 'none' : 'transform 160ms ease',
          touchAction: isDragged ? 'none' : 'pan-y',
          boxShadow: isDragged ? '0 12px 24px 0 rgb(0, 0, 0, 24%)' : void 0,
        }}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <Card borderRadius="m" color={color} height="100%" onClick={handleCardClick} padding="m">
          {children}
        </Card>
      </div>
    </div>
  )
}
