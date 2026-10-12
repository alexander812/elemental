import { useEffect, useRef, useState } from 'react'

export const ROW_HEIGHT = 64
export const ROW_GAP = 8
export const ROW_STEP = ROW_HEIGHT + ROW_GAP

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

type DragState = {
  rowId: string
  index: number
  pointerId: number
  offsetY: number
  targetSlot: number
}

export type RowReorderRowProps = {
  id: string
  index: number
  dragging: boolean
  dragOffsetY: number
  shift: number
  reorderActive: boolean
  settle: boolean
  open: boolean
  onReorderStart: (rowId: string, index: number, pointerId: number) => void
  onReorderMove: (pointerId: number, dy: number) => void
  onReorderEnd: (rowId: string) => void
  onReorderCancel: () => void
  onOpen: (rowId: string | null) => void
}

export type RowReorder = ReturnType<typeof useRowReorder>

export function useRowReorder(ids: string[], commit: (nextIds: string[]) => Promise<unknown>) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [settle, setSettle] = useState(false)
  const [openRowId, setOpenRowId] = useState<string | null>(null)

  const dragRef = useRef<DragState | null>(null)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateDrag = (next: DragState | null) => {
    dragRef.current = next
    setDrag(next)
  }

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    }
  }, [])

  const touchHandlerRef = useRef<((event: TouchEvent) => void) | null>(null)
  const setTouchBlocked = (blocked: boolean) => {
    if (blocked) {
      if (!touchHandlerRef.current) {
        touchHandlerRef.current = (event: TouchEvent) => {
          event.preventDefault()
        }
        document.addEventListener('touchmove', touchHandlerRef.current, { passive: false })
      }
    } else if (touchHandlerRef.current) {
      document.removeEventListener('touchmove', touchHandlerRef.current)
      touchHandlerRef.current = null
    }
  }

  useEffect(() => {
    return () => setTouchBlocked(false)
  }, [])

  const handleReorderStart = (rowId: string, index: number, pointerId: number) => {
    setTouchBlocked(true)
    setOpenRowId(null)
    updateDrag({ rowId, index, pointerId, offsetY: 0, targetSlot: index })
  }

  const handleReorderMove = (pointerId: number, dy: number) => {
    const state = dragRef.current
    if (!state || state.pointerId !== pointerId) return

    const targetSlot = clamp(
      Math.round((state.index * ROW_STEP + dy) / ROW_STEP),
      0,
      ids.length - 1
    )

    updateDrag({ ...state, offsetY: dy, targetSlot })
  }

  const handleReorderEnd = (rowId: string) => {
    setTouchBlocked(false)

    const state = dragRef.current
    if (!state || state.rowId !== rowId) return

    if (state.targetSlot === state.index) {
      updateDrag(null)
      return
    }

    const nextIds = [...ids]
    const [moved] = nextIds.splice(state.index, 1)
    nextIds.splice(state.targetSlot, 0, moved)

    const applySettle = () => {
      if (dragRef.current !== state) return

      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
      setSettle(true)
      updateDrag(null)
      settleTimerRef.current = setTimeout(() => setSettle(false), 100)
    }

    commit(nextIds).then(applySettle, applySettle)
  }

  const handleReorderCancel = () => {
    setTouchBlocked(false)
    updateDrag(null)
  }

  const rowProps = (rowId: string, index: number): RowReorderRowProps => {
    const isDragged = drag?.rowId === rowId
    let shift = 0

    if (drag && !isDragged) {
      if (index > drag.index && index <= drag.targetSlot) shift = -ROW_STEP
      if (index < drag.index && index >= drag.targetSlot) shift = ROW_STEP
    }

    return {
      id: rowId,
      index,
      dragging: isDragged,
      dragOffsetY: drag?.offsetY ?? 0,
      shift,
      reorderActive: !!drag,
      settle,
      open: openRowId === rowId,
      onReorderStart: handleReorderStart,
      onReorderMove: handleReorderMove,
      onReorderEnd: handleReorderEnd,
      onReorderCancel: handleReorderCancel,
      onOpen: setOpenRowId,
    }
  }

  return { openRowId, rowProps, setOpenRowId }
}
