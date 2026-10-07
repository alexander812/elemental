import { useEffect, useMemo } from 'react'

import { useUnit } from 'effector-react'

import { IconEducation, IconPlusBig } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  EmptyScreen,
  Header,
  Spinner,
  Stack,
  Text,
} from '@elemental/ui-kit'

import type { Course } from '../../../lib/types'
import { $lessons } from '../../lessons/store'
import { goToLessons, pushScreen } from '../../navigation/store'
import { courseSelected, fetchCoursesFx, $courses, $coursesLoading, $currentCourseId } from '../store'

import classes from './CoursesView.module.pcss'

const lessonWord = (count: number): string => {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return 'урок'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'урока'

  return 'уроков'
}

export function CoursesView() {
  const courses = useUnit($courses)
  const lessons = useUnit($lessons)
  const loading = useUnit($coursesLoading)
  const currentCourseId = useUnit($currentCourseId)

  useEffect(() => {
    fetchCoursesFx()
  }, [])

  const lessonCounts = useMemo(() => {
    const counts = new Map<string, number>()

    lessons.forEach((lesson) => {
      counts.set(lesson.courseId, (counts.get(lesson.courseId) ?? 0) + 1)
    })

    return counts
  }, [lessons])

  const visible = useMemo(() => [...courses].sort((a, b) => a.order - b.order), [courses])

  const handleOpen = (course: Course) => {
    courseSelected(course.id)
    goToLessons()
  }

  const handleAddNew = () => {
    pushScreen({ name: 'course-create' })
  }

  const logo = (
    <img
      alt=""
      src={`${import.meta.env.BASE_URL}favicon.svg`}
      style={{ display: 'block', width: 32, height: 32, marginInlineEnd: 10 }}
    />
  )

  if (loading && visible.length === 0) {
    return (
      <Box grow height="100%">
        <Header startToolbar={logo} text="Lexi" />
        <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
          <Spinner size="l" />
        </Stack>
      </Box>
    )
  }

  if (visible.length === 0) {
    return (
      <Box grow height="100%">
        <Header startToolbar={logo} text="Lexi" />
        <EmptyScreen
          action={
            <Button startIcon={<IconPlusBig fontSize={16} />} onClick={handleAddNew}>
              Добавить курс
            </Button>
          }
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text="Пока нет ни одного курса"
        />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header startToolbar={logo} text="Lexi" />
      <Box grow padding="m">
        <div className={classes.list}>
          {visible.map((course) => {
            const count = lessonCounts.get(course.id) ?? 0

            return (
              <Card
                key={course.id}
                active={course.id === currentCourseId}
                borderRadius="m"
                color="primary"
                padding="m"
                onClick={() => handleOpen(course)}
              >
                <Stack spacing="xs" height="100%">
                  <Stack
                    direction="row"
                    horizontalAlign="space-between"
                    spacing="s"
                    verticalAlign="center"
                  >
                    <Text overflow="ellipsis" variant="M / Medium">
                      {course.name}
                    </Text>
                    <Stack shrink={0}>
                      <Text color="contrast-secondary" overflow="nowrap" variant="S / Medium">
                        {count} {lessonWord(count)}
                      </Text>
                    </Stack>
                  </Stack>
                  <div className={classes.description}>
                    <Text color="contrast-secondary" variant="XS / Medium">
                      {course.description}
                    </Text>
                  </div>
                </Stack>
              </Card>
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
          Добавить курс
        </Button>
      </Box>
    </Box>
  )
}
