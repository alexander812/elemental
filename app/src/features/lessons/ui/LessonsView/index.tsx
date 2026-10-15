import { useEffect, useMemo, useState } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { IconEdit, IconEducation, IconMoreVertical, IconPlusBig, IconTrash } from '@elemental/icons'
import {
  Box,
  Button,
  ButtonIcon,
  EmptyScreen,
  Header,
  Menu,
  Spinner,
  Stack, Text,
} from '@elemental/ui-kit'

import { getLessonTaskCounts, getProgressRatio } from '../../../../lib/progress'
import type { Lesson } from '../../../../lib/types'
import { ROW_GAP, useRowReorder } from '../../../../shared/ui/SwipeRow/useRowReorder'
import { ConfirmSheet } from '../../../../shared/ui/ConfirmSheet'
import { deleteCourseFx, $courses, $currentCourseId } from '../../../courses/store'
import type { DeleteCourseMode } from '../../../courses/store'
import { pushScreen } from '../../../navigation/store'
import { $onboardingOpened } from '../../../onboarding/store'
import { useShakeHint } from '../../../onboarding/ui/useShakeHint'
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
  const onboardingOpened = useUnit($onboardingOpened)

  const intl = useIntl()

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

  const lessonTaskCounts = useMemo(() => getLessonTaskCounts(sets), [sets])

  const firstLessonShake = useShakeHint('first-lesson', !onboardingOpened && visible.length > 0)

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
                ariaLabel={intl.formatMessage({
                  id: 'lessons_course_menu',
                  defaultMessage: 'Course menu',
                })}
                icon={<IconMoreVertical fontSize={24} />}
                variant="flat"
              />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item
                icon={<IconEdit fontSize={16} />}
                label={<FormattedMessage id="lessons_edit_course" defaultMessage="Edit course" />}
                onClick={handleEditCourse}
              />
              {!isBaseCourse ? (
                <Menu.Item
                  icon={<IconTrash fontSize={16} />}
                  label={
                    <FormattedMessage id="lessons_delete_course" defaultMessage="Delete course" />
                  }
                  onClick={() => setConfirmCourseDelete(true)}
                />
              ) : null}
            </Menu.Content>
          </Menu.Root>
        ) : null
      }
      text={course?.name ?? <FormattedMessage id="lessons_title" defaultMessage="Lessons" />}
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
          <EmptyScreen
            action={
              <Button
                startIcon={<IconPlusBig fontSize={16} />}
                onClick={() => pushScreen({ name: 'course-create' })}
              >
                <FormattedMessage id="courses_add" defaultMessage="Add course" />
              </Button>
            }
            fullHeight
            icon={<IconEducation fontSize={24} />}
            text={<FormattedMessage id="courses_empty" defaultMessage="No courses yet" />}
          />
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
              <FormattedMessage id="lessons_add" defaultMessage="Add lesson" />
            </Button>
          }
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text={
            <FormattedMessage id="lessons_empty" defaultMessage="The course has no lessons yet" />
          }
        />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      {header}
      <Box padding="0 m 0 m">
        <Text variant="M / Medium">
          <FormattedMessage id="lessons_title" defaultMessage="Lessons" />
        </Text>
      </Box>
      <Box grow padding="m">
        <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
          {visible.map((lesson, index) => {
            const counts = lessonTaskCounts.get(lesson.id)

            return (
              <div key={lesson.id} {...(index === 0 ? firstLessonShake : {})}>
                <LessonRow
                  examPassed={counts !== undefined && counts.passed === counts.total}
                  index={index}
                  lesson={lesson}
                  progress={getProgressRatio(counts)}
                  reorder={reorder}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onTap={handleTap}
                />
              </div>
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
          <FormattedMessage id="lessons_add" defaultMessage="Add lesson" />
        </Button>
      </Box>

      <ConfirmSheet
        opened={pendingDelete !== null}
        text={
          <FormattedMessage
            id="lessons_delete_confirm"
            defaultMessage="Deleting the lesson “{name}” will also delete all its sets and cards permanently."
            values={{ name: pendingDelete?.name }}
          />
        }
        onClosed={() => setPendingDelete(null)}
      >
        <Button color="negative" fullWidth loading={deletePending} onClick={handleConfirmDelete}>
          <FormattedMessage id="common_delete" defaultMessage="Delete" />
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setPendingDelete(null)}>
          <FormattedMessage id="common_cancel" defaultMessage="Cancel" />
        </Button>
      </ConfirmSheet>

      <ConfirmSheet
        opened={confirmCourseDelete}
        text={
          <FormattedMessage
            id="lessons_delete_course_confirm"
            defaultMessage="Delete the course “{course}”? You can delete its lessons with it or move them to “{base}”."
            values={{ course: course?.name, base: baseCourse?.name }}
          />
        }
        onClosed={() => setConfirmCourseDelete(false)}
      >
        <Button
          color="negative"
          fullWidth
          loading={deleteCoursePending}
          onClick={() => handleDeleteCourse('with-lessons')}
        >
          <FormattedMessage
            id="lessons_delete_course_with_lessons"
            defaultMessage="Delete course and lessons"
          />
        </Button>
        <Button
          disabled={deleteCoursePending}
          fullWidth
          variant="secondary"
          onClick={() => handleDeleteCourse('course-only')}
        >
          <FormattedMessage id="lessons_delete_course_only" defaultMessage="Delete course only" />
        </Button>
        <Button
          disabled={deleteCoursePending}
          fullWidth
          variant="secondary"
          onClick={() => setConfirmCourseDelete(false)}
        >
          <FormattedMessage id="common_cancel" defaultMessage="Cancel" />
        </Button>
      </ConfirmSheet>
    </Box>
  )
}
