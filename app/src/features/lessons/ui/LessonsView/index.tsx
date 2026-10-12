import { useEffect, useMemo, useState } from 'react'

import { useUnit } from 'effector-react'

import { IconEdit, IconEducation, IconMoreVertical, IconPlusBig, IconTrash } from '@elemental/icons'
import {
  Box,
  Button,
  ButtonIcon,
  EmptyScreen,
  Header,
  Menu,
  Spinner,
  Stack,
} from '@elemental/ui-kit'

import type { Lesson } from '../../../../lib/types'
import { ROW_GAP, useRowReorder } from '../../../../shared/ui/SwipeRow/useRowReorder'
import { ConfirmSheet } from '../../../../shared/ui/ConfirmSheet'
import { deleteCourseFx, $courses, $currentCourseId } from '../../../courses/store'
import type { DeleteCourseMode } from '../../../courses/store'
import { pushScreen } from '../../../navigation/store'
import { $sets } from '../../../sets/store'
import {
  deleteLessonFx,
  fetchLessonsFx,
  reorderLessonsFx,
  $lessons,
  $lessonsLoading,
} from '../../store'
import { LessonRow } from './components/LessonRow'

export function LessonsView() {
  const lessons = useUnit($lessons)
  const sets = useUnit($sets)
  const courses = useUnit($courses)
  const currentCourseId = useUnit($currentCourseId)
  const loading = useUnit($lessonsLoading)
  const deletePending = useUnit(deleteLessonFx.pending)
  const deleteCoursePending = useUnit(deleteCourseFx.pending)

  const [pendingDelete, setPendingDelete] = useState<Lesson | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmCourseDelete, setConfirmCourseDelete] = useState(false)

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

  const examPassedByLesson = useMemo(() => {
    const map = new Map<string, boolean>()

    for (const cardSet of sets) {
      if (!cardSet.active) continue

      map.set(cardSet.lessonId, (map.get(cardSet.lessonId) ?? true) && cardSet.examPassed)
    }

    return map
  }, [sets])

  const reorder = useRowReorder(
    visible.map((lesson) => lesson.id),
    reorderLessonsFx
  )

  const handleDelete = (lesson: Lesson) => {
    reorder.setOpenRowId(null)
    setPendingDelete(lesson)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return

    await deleteLessonFx(pendingDelete.id)
    setPendingDelete(null)
  }

  const handleTap = (lesson: Lesson) => {
    if (reorder.openRowId) {
      reorder.setOpenRowId(null)
      return
    }

    pushScreen({ name: 'lesson', lessonId: lesson.id })
  }

  const handleEdit = (lesson: Lesson) => {
    reorder.setOpenRowId(null)
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
          {visible.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              examPassed={examPassedByLesson.get(lesson.id) ?? false}
              index={index}
              lesson={lesson}
              reorder={reorder}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onTap={handleTap}
            />
          ))}
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
