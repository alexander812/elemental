import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useUnit } from 'effector-react'

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

import { getLanguageName } from '../../../lib/languages'
import type { Lesson } from '../../../lib/types'
import { InputWithVoice } from '../../../shared/ui/InputWithVoice'
import { $courses } from '../../courses/store'
import { $languages } from '../../languages/store'
import { popScreen, pushScreen } from '../../navigation/store'
import { $userLang } from '../../theme/store'
import { createLessonFx, updateLessonFx, $lessons } from '../store'

const defaultLessonName = (lessons: Lesson[], courseId: string): string => {
  const courseLessons = lessons.filter((lesson) => lesson.courseId === courseId)
  const numbers = courseLessons
    .map((lesson) => /^Урок\s+(\d+)$/.exec(lesson.name)?.[1])
    .filter((value): value is string => value !== undefined)
    .map(Number)

  if (numbers.length === 0) return `Урок ${courseLessons.length + 1}`

  return `Урок ${Math.max(...numbers) + 1}`
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
  const userLang = useUnit($userLang)
  const createPending = useUnit(createLessonFx.pending)
  const updatePending = useUnit(updateLessonFx.pending)

  const lesson = useMemo(
    () => (lessonId ? lessons.find((item) => item.id === lessonId) : undefined),
    [lessons, lessonId]
  )
  const isEditing = lessonId !== undefined

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.order - b.order), [courses])

  const [name, setName] = useState(
    () =>
      lesson?.name ??
      defaultLessonName(lessons, lesson?.courseId ?? courseId ?? sortedCourses[0]?.id ?? '')
  )
  const [selectedCourseId, setSelectedCourseId] = useState(
    lesson?.courseId ?? courseId ?? sortedCourses[0]?.id ?? ''
  )

  const course = useMemo(
    () => courses.find((item) => item.id === selectedCourseId),
    [courses, selectedCourseId]
  )

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
        <Header back text="Изменить урок" onBackClick={() => popScreen()} />
        <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Урок не найден" />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={isEditing ? 'Изменить урок' : 'Новый урок'}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <form onSubmit={handleSubmit}>
          <Stack spacing="l">
            <InputWithVoice
              autoFocus
              floatingLabel
              fullWidth
              lang={userLang}
              placeholder="Название урока"
              size="m"
              value={name}
              onChange={setName}
            />

            <Card padding="l">
              <Stack spacing="xs">
                <Text color="contrast-secondary" variant="XS / Medium">
                  Курс
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
                  Язык курса
                </Text>
                <Text variant="M / Medium">
                  {course ? getLanguageName(course.lang, languages) : '—'}
                </Text>
                <Text color="contrast-tertiary" variant="XS / Medium">
                  Наследуется из курса
                </Text>
              </Stack>
            </Card>

            <Button disabled={!canApply} fullWidth loading={pending} type="submit">
              {isEditing ? 'Сохранить' : 'Применить'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
