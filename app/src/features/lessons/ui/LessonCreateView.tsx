import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { IconEducation } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  EmptyScreen,
  Header,
  Select,
  Stack,
  Text,
} from '@elemental/ui-kit'

import { getIntl } from '../../../lib/i18n'
import { getLanguageName } from '../../../lib/languages'
import type { LanguageCode } from '../../../lib/languages'
import type { Lesson } from '../../../lib/types'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $courses } from '../../courses/store'
import { $languages } from '../../languages/store'
import { popScreen, pushScreen } from '../../navigation/store'
import { $userLang } from '../../theme/store'
import { createLessonFx, updateLessonFx, $lessons } from '../store'

const DEFAULT_LESSON_NAME = { id: 'lessons_default_name', defaultMessage: 'Lesson {number}' }

const defaultLessonName = (
  userLang: LanguageCode,
  lessons: Lesson[],
  courseId: string
): string => {
  const courseLessons = lessons.filter((lesson) => lesson.courseId === courseId)
  const numbers = courseLessons
    .map((lesson) => /(\d+)\s*$/.exec(lesson.name)?.[1])
    .filter((value): value is string => value !== undefined)
    .map(Number)

  if (numbers.length === 0)
    return getIntl(userLang).formatMessage(DEFAULT_LESSON_NAME, { number: courseLessons.length + 1 })

  return getIntl(userLang).formatMessage(DEFAULT_LESSON_NAME, { number: Math.max(...numbers) + 1 })
}

export function LessonCreateView({
  lessonId,
  courseId,
}: {
  lessonId?: string
  courseId?: string
}) {
  const lessons = useUnit($lessons)
  const courses = useUnit($courses)
  const languages = useUnit($languages)
  const settingsUserLang = useUnit($userLang)
  const createPending = useUnit(createLessonFx.pending)
  const updatePending = useUnit(updateLessonFx.pending)

  const lesson = useMemo(
    () => (lessonId ? lessons.find((item) => item.id === lessonId) : undefined),
    [lessons, lessonId]
  )
  const isEditing = lessonId !== undefined

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.order - b.order), [courses])

  const initialCourseId = lesson?.courseId ?? courseId ?? sortedCourses[0]?.id ?? ''
  const initialUserLang =
    sortedCourses.find((item) => item.id === initialCourseId)?.userLang ?? settingsUserLang

  const [name, setName] = useState(
    () => lesson?.name ?? defaultLessonName(initialUserLang, lessons, initialCourseId)
  )
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId)

  const course = useMemo(
    () => courses.find((item) => item.id === selectedCourseId),
    [courses, selectedCourseId]
  )
  const courseUserLang = course?.userLang ?? settingsUserLang

  const courseOptions = useMemo(
    () => sortedCourses.map((item) => ({ label: item.name, value: item.id })),
    [sortedCourses]
  )

  const canApply = name.trim().length > 0 && selectedCourseId.length > 0
  const pending = createPending || updatePending

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!canApply) return

    if (isEditing && lesson) {
      await updateLessonFx({ lessonId: lesson.id, courseId: selectedCourseId, name })
      popScreen()
      return
    }

    const { lessonId: createdLessonId } = await createLessonFx({
      courseId: selectedCourseId,
      name,
    })

    popScreen()
    pushScreen({ name: 'lesson', lessonId: createdLessonId })
  }

  if (isEditing && !lesson) {
    return (
      <Box grow height="100%">
        <Header
          back
          text={<FormattedMessage id="lesson_create_edit" defaultMessage="Edit lesson" />}
          onBackClick={() => popScreen()}
        />
        <EmptyScreen
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text={<FormattedMessage id="lesson_create_not_found" defaultMessage="Lesson not found" />}
        />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={
          isEditing ? (
            <FormattedMessage id="lesson_create_edit" defaultMessage="Edit lesson" />
          ) : (
            <FormattedMessage id="lesson_create_new" defaultMessage="New lesson" />
          )
        }
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <form onSubmit={handleSubmit}>
          <Stack spacing="l">
            <InputWithVoice
              autoFocus
              floatingLabel
              fullWidth
              lang={courseUserLang}
              placeholder={
                <FormattedMessage
                  id="lesson_create_name_placeholder"
                  defaultMessage="Lesson name"
                />
              }
              size="m"
              value={name}
              onChange={setName}
            />

            <Card padding="l">
              <Stack spacing="xs">
                <Text color="contrast-secondary" variant="XS / Medium">
                  <FormattedMessage id="lesson_create_course" defaultMessage="Course" />
                </Text>
                <Select
                  fullWidth
                  options={courseOptions}
                  value={selectedCourseId}
                  onChange={setSelectedCourseId}
                />
              </Stack>
            </Card>

            <Card padding="l">
              <Stack spacing="xs">
                <Text color="contrast-secondary" variant="XS / Medium">
                  <FormattedMessage id="lesson_create_lang" defaultMessage="Course language" />
                </Text>
                <Text variant="M / Medium">
                  {course ? getLanguageName(course.lang, languages) : '—'}
                </Text>
                <Text color="contrast-tertiary" variant="XS / Medium">
                  <FormattedMessage
                    id="lesson_create_inherited"
                    defaultMessage="Inherited from the course"
                  />
                </Text>
              </Stack>
            </Card>

            <Button disabled={!canApply} fullWidth loading={pending} type="submit">
              {isEditing ? (
                <FormattedMessage id="common_save" defaultMessage="Save" />
              ) : (
                <FormattedMessage id="common_apply" defaultMessage="Apply" />
              )}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
