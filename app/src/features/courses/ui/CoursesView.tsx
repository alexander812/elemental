import { useEffect, useMemo, useState } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { IconEducation, IconPlusBig } from '@elemental/icons'
import {
  BottomSheet,
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
import { $onboardingOpened } from '../../onboarding/store'
import { useDelayedShake } from '../../onboarding/ui/useDelayedShake'
import { useShakeHint } from '../../onboarding/ui/useShakeHint'
import { $userLang } from '../../theme/store'
import {
  addedCourseShown,
  courseSelected,
  fetchCoursesFx,
  $addedCourseId,
  $courses,
  $coursesLoading,
  $currentCourseId,
} from '../store'

import classes from './CoursesView.module.pcss'

const ADDED_COURSE_SHAKE_DELAY_MS = 1000

const langLabel = (code: string): string => code.charAt(0).toUpperCase() + code.slice(1)

export function CoursesView() {
  const courses = useUnit($courses)
  const lessons = useUnit($lessons)
  const loading = useUnit($coursesLoading)
  const currentCourseId = useUnit($currentCourseId)
  const userLang = useUnit($userLang)
  const onboardingOpened = useUnit($onboardingOpened)
  const addedCourseId = useUnit($addedCourseId)

  const [addOpened, setAddOpened] = useState(false)

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

  const addHintShake = useShakeHint(
    'courses-add',
    !onboardingOpened && !loading && visible.length === 0
  )

  const addedCourseShake = useDelayedShake(
    addedCourseId !== null,
    ADDED_COURSE_SHAKE_DELAY_MS,
    addedCourseShown
  )

  const handleOpen = (course: Course) => {
    courseSelected(course.id)
    goToLessons()
  }

  const handleAddNew = () => {
    setAddOpened(true)
  }

  const handleCreateNew = () => {
    setAddOpened(false)
    pushScreen({ name: 'course-create' })
  }

  const handleFindReady = () => {
    setAddOpened(false)
    pushScreen({ name: 'course-search' })
  }

  const addSheet = (
    <BottomSheet opened={addOpened} onClosed={() => setAddOpened(false)}>
      <Box padding="l">
        <Stack spacing="m">
          <Text align="center" variant="M / Medium">
            <FormattedMessage id="courses_add" defaultMessage="Add course" />
          </Text>
          <Button fullWidth onClick={handleFindReady}>
            <FormattedMessage id="courses_find_ready" defaultMessage="Find a ready-made course" />
          </Button>
          <Button fullWidth variant="secondary" onClick={handleCreateNew}>
            <FormattedMessage id="courses_create_new" defaultMessage="Create new" />
          </Button>

        </Stack>
      </Box>
    </BottomSheet>
  )

  const logo = (
    <img
      alt=""
      src={`${import.meta.env.BASE_URL}icons/emblem.svg`}
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
            <div {...addHintShake}>
              <Button startIcon={<IconPlusBig fontSize={16} />} onClick={handleAddNew}>
                <FormattedMessage id="courses_add" defaultMessage="Add course" />
              </Button>
            </div>
          }
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text={<FormattedMessage id="courses_empty" defaultMessage="No courses yet" />}
        />
        {addSheet}
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      <Header startToolbar={logo} text="Lexi" />
      <Box padding="0 m 0 m">
        <Text variant="M / Medium">
          <FormattedMessage id="courses_title" defaultMessage="Courses" />
        </Text>
      </Box>
      <Box grow padding="m">
        <div className={classes.list}>
          {visible.map((course) => {
            const count = lessonCounts.get(course.id) ?? 0

            return (
              <div key={course.id} {...(course.id === addedCourseId ? addedCourseShake : {})}>
                <Card
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
                        {course.name} ({langLabel(userLang)}-{langLabel(course.lang)})
                      </Text>
                      <Stack shrink={0}>
                        <Text color="contrast-secondary" overflow="nowrap" variant="S / Medium">
                          <FormattedMessage
                            id="courses_lessons_count"
                            defaultMessage="{count, plural, one {# lesson} other {# lessons}}"
                            values={{ count }}
                          />
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
          <FormattedMessage id="courses_add" defaultMessage="Add course" />
        </Button>
      </Box>
      {addSheet}
    </Box>
  )
}
