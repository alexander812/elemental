import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'

import { useUnit } from 'effector-react'

import { IconEdit, IconEducation, IconMoreVertical, IconPlusBig, IconTrash } from '@elemental/icons'
import {
  Box,
  Button,
  ButtonIcon,
  Card,
  EmptyScreen,
  Header,
  Menu,
  Spinner,
  Stack,
  Text,
} from '@elemental/ui-kit'

import type { Lesson } from '../../../lib/types'
import { ConfirmSheet } from '../../../shared/ui/ConfirmSheet'
import { deleteCourseFx, $courses, $currentCourseId } from '../../courses/store'
import type { DeleteCourseMode } from '../../courses/store'
import { pushScreen } from '../../navigation/store'
import { deleteLessonFx, fetchLessonsFx, reorderLessonsFx, $lessons, $lessonsLoading } from '../store'

const ROW_HEIGHT = 64
const ROW_GAP = 8
const ROW_STEP = ROW_HEIGHT + ROW_GAP
const TRASH_WIDTH = 96
const LONG_PRESS_MS = 420
const MOVE_SLOP = 10

type DragState = {
  rowId: string
  index: number
  pointerId: number
  offsetY: number
  targetSlot: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

type LessonRowProps = {
  lesson: Lesson
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
  onDelete: (lesson: Lesson) => void
  onEdit: (lesson: Lesson) => void
  onOpen: (lessonId: string | null) => void
  onTap: (lesson: Lesson) => void
}

function LessonRow({
  lesson,
  index,
  dragging,
  dragOffsetY,
  shift,
  reorderActive,
  settle,
  open,
  onReorderStart,
  onReorderMove,
  onReorderEnd,
  onReorderCancel,
  onDelete,
  onEdit,
  onOpen,
  onTap,
}: LessonRowProps) {
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

    onTap(lesson)
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
      onReorderStart(lesson.id, index, event.pointerId)
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
        onReorderStart(lesson.id, index, event.pointerId)
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
      setDx(clamp(startDx + event.clientX - x, 0, TRASH_WIDTH))
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
        onTap(lesson)
      }
      return
    }

    if (phase === 'swipe') {
      setPhase('idle')
      const nextDx = dx > TRASH_WIDTH / 2 ? TRASH_WIDTH : 0
      setDx(nextDx)
      onOpen(nextDx > 0 ? lesson.id : null)
      return
    }

    if (phase === 'reorder') {
      setPhase('idle')
      onReorderEnd(lesson.id)
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

  const rowStyle: CSSProperties = {
    position: 'relative',
    height: ROW_HEIGHT,
    transform: isDragged ? `translateY(${dragOffsetY}px)` : `translateY(${shift}px)`,
    transition: isDragged || settle ? 'none' : 'transform 160ms ease',
    zIndex: isDragged ? 3 : 1,
  }

  const contentStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    transform: `translateX(${dx}px) scale(${isDragged ? 1.03 : 1})`,
    transition: isDragged || settle ? 'none' : 'transform 160ms ease',
    height: '100%',
    touchAction: isDragged ? 'none' : 'pan-y',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    boxShadow: isDragged ? '0 12px 24px 0 rgb(0, 0, 0, 24%)' : void 0,
  }

  return (
    <div style={rowStyle}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: TRASH_WIDTH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          background: 'var(--negative-bg-default)',
          color: 'var(--negative-over)',
          cursor: 'pointer',
          opacity: clamp(dx / TRASH_WIDTH, 0, 1),
        }}
        onClick={() => onDelete(lesson)}
      >
        <IconTrash fontSize={24} />
      </div>
      <div
        style={contentStyle}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <Card borderRadius="m" color="primary" height="100%" onClick={handleCardClick} padding="m">
          <Stack direction="row" spacing="m" verticalAlign="center" height="100%">
            <Box grow>
              <Text overflow="ellipsis" variant="M / Medium">
                {lesson.name}
              </Text>
            </Box>
            <ButtonIcon
              ariaLabel="Изменить урок"
              icon={<IconEdit fontSize={24} />}
              size="s"
              variant="flat"
              onClick={(event) => {
                event.stopPropagation()
                onEdit(lesson)
              }}
              onPointerDown={(event) => event.stopPropagation()}
            />
          </Stack>
        </Card>
      </div>
    </div>
  )
}

export function LessonsView() {
  const lessons = useUnit($lessons)
  const courses = useUnit($courses)
  const currentCourseId = useUnit($currentCourseId)
  const loading = useUnit($lessonsLoading)
  const deletePending = useUnit(deleteLessonFx.pending)
  const deleteCoursePending = useUnit(deleteCourseFx.pending)

  const [drag, setDrag] = useState<DragState | null>(null)
  const [settle, setSettle] = useState(false)
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Lesson | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmCourseDelete, setConfirmCourseDelete] = useState(false)

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

  useEffect(() => {
    fetchLessonsFx()
  }, [])

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.order - b.order), [courses])
  const baseCourse = sortedCourses[0]
  const course = useMemo(
    () => sortedCourses.find((item) => item.id === currentCourseId) ?? baseCourse,
    [sortedCourses, currentCourseId, baseCourse]
  )
  const isBaseCourse = course !== undefined && course.id === baseCourse?.id

  const visible = useMemo(
    () =>
      course
        ? lessons
            .filter((lesson) => lesson.courseId === course.id)
            .sort((a, b) => a.order - b.order)
        : [],
    [lessons, course]
  )

  const touchHandlerRef = useRef<(event: TouchEvent) => void>(null)
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
      visible.length - 1
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

    const ids = visible.map((lesson) => lesson.id)
    const [moved] = ids.splice(state.index, 1)
    ids.splice(state.targetSlot, 0, moved)

    const applySettle = () => {
      if (dragRef.current !== state) return

      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
      setSettle(true)
      updateDrag(null)
      settleTimerRef.current = setTimeout(() => setSettle(false), 100)
    }

    reorderLessonsFx(ids).then(applySettle, applySettle)
  }

  const handleReorderCancel = () => {
    setTouchBlocked(false)
    updateDrag(null)
  }

  const handleDelete = (lesson: Lesson) => {
    setOpenRowId(null)
    setPendingDelete(lesson)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return

    await deleteLessonFx(pendingDelete.id)
    setPendingDelete(null)
  }

  const handleTap = (lesson: Lesson) => {
    if (openRowId) {
      setOpenRowId(null)
      return
    }

    pushScreen({ name: 'lesson', lessonId: lesson.id })
  }

  const handleEdit = (lesson: Lesson) => {
    setOpenRowId(null)
    pushScreen({ name: 'lesson-create', lessonId: lesson.id })
  }

  const handleAddNew = () => {
    if (!course) return
    pushScreen({ name: 'lesson-create', courseId: course.id })
  }

  const handleEditCourse = () => {
    if (!course) return
    pushScreen({ name: 'course-create', courseId: course.id })
  }

  const handleDeleteCourse = async (mode: DeleteCourseMode) => {
    if (!course || !baseCourse) return

    await deleteCourseFx({ courseId: course.id, baseCourseId: baseCourse.id, mode })
    setConfirmCourseDelete(false)
  }

  const header = (
    <Header
      endToolbar={
        course ? (
          <Menu.Root open={menuOpen} onToggle={setMenuOpen}>
            <Menu.Trigger>
              <ButtonIcon
                ariaLabel="Меню курса"
                icon={<IconMoreVertical fontSize={24} />}
                variant="flat"
              />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item
                icon={<IconEdit fontSize={16} />}
                label="Редактировать курс"
                onClick={handleEditCourse}
              />
              {!isBaseCourse ? (
                <Menu.Item
                  icon={<IconTrash fontSize={16} />}
                  label="Удалить курс"
                  onClick={() => setConfirmCourseDelete(true)}
                />
              ) : null}
            </Menu.Content>
          </Menu.Root>
        ) : null
      }
      text={course?.name ?? 'Уроки'}
    />
  )

  if (!course) {
    return (
      <Box grow height="100%">
        {header}
        {loading ? (
          <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
            <Spinner size="l" />
          </Stack>
        ) : (
          <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Курс не найден" />
        )}
      </Box>
    )
  }

  if (visible.length === 0) {
    return (
      <Box grow height="100%">
        {header}
        <EmptyScreen
          action={
            <Button startIcon={<IconPlusBig fontSize={16} />} onClick={handleAddNew}>
              Добавить урок
            </Button>
          }
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text="Пока в курсе нет уроков"
        />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      {header}
      <Box grow padding="m">
        <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
          {visible.map((lesson, index) => {
            const isDragged = drag?.rowId === lesson.id
            const shift = (() => {
              if (!drag || isDragged) return 0
              if (index > drag.index && index <= drag.targetSlot) return -ROW_STEP
              if (index < drag.index && index >= drag.targetSlot) return ROW_STEP
              return 0
            })()

            return (
              <LessonRow
                key={lesson.id}
                dragOffsetY={drag?.offsetY ?? 0}
                dragging={isDragged}
                index={index}
                lesson={lesson}
                open={openRowId === lesson.id}
                reorderActive={!!drag}
                settle={settle}
                shift={shift}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onOpen={setOpenRowId}
                onReorderCancel={handleReorderCancel}
                onReorderEnd={handleReorderEnd}
                onReorderMove={handleReorderMove}
                onReorderStart={handleReorderStart}
                onTap={handleTap}
              />
            )
          })}
        </div>
      </Box>
      <Box padding="m">
        <Button
          fullWidth
          startIcon={<IconPlusBig fontSize={16} />}
          variant="secondary"
          onClick={handleAddNew}
        >
          Добавить урок
        </Button>
      </Box>

      <ConfirmSheet
        opened={pendingDelete !== null}
        text={`При удалении урока «${pendingDelete?.name}» все вложенные в него задания и карточки будут удалены без возможности восстановления.`}
        onClosed={() => setPendingDelete(null)}
      >
        <Button color="negative" fullWidth loading={deletePending} onClick={handleConfirmDelete}>
          Удалить
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setPendingDelete(null)}>
          Отмена
        </Button>
      </ConfirmSheet>

      <ConfirmSheet
        opened={confirmCourseDelete}
        text={`Удалить курс «${course?.name}»? Уроки можно удалить вместе с курсом или перенести в «${baseCourse?.name}».`}
        onClosed={() => setConfirmCourseDelete(false)}
      >
        <Button
          color="negative"
          fullWidth
          loading={deleteCoursePending}
          onClick={() => handleDeleteCourse('with-lessons')}
        >
          Удалить курс и уроки
        </Button>
        <Button
          disabled={deleteCoursePending}
          fullWidth
          variant="secondary"
          onClick={() => handleDeleteCourse('course-only')}
        >
          Удалить только курс
        </Button>
        <Button
          disabled={deleteCoursePending}
          fullWidth
          variant="secondary"
          onClick={() => setConfirmCourseDelete(false)}
        >
          Отмена
        </Button>
      </ConfirmSheet>
    </Box>
  )
}
