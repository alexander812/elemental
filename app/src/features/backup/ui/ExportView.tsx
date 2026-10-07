import { useMemo, useState } from 'react'

import { useUnit } from 'effector-react'

import { IconDownload, IconEducation } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  EmptyScreen,
  FormHelperText,
  Header,
  Stack,
} from '@elemental/ui-kit'

import type { Lesson } from '../../../lib/types'
import { $courses } from '../../courses/store'
import { $lessons } from '../../lessons/store'
import { popScreen } from '../../navigation/store'
import { exportBackupFx } from '../store'

import classes from './ExportView.module.pcss'

export function ExportView() {
  const courses = useUnit($courses)
  const lessons = useUnit($lessons)
  const exporting = useUnit(exportBackupFx.pending)

  const [selected, setSelected] = useState<ReadonlySet<string> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.order - b.order), [courses])

  const lessonsByCourse = useMemo(() => {
    const grouped = new Map<string, Lesson[]>()

    ;[...lessons]
      .sort((a, b) => a.order - b.order)
      .forEach((lesson) => {
        const list = grouped.get(lesson.courseId) ?? []
        list.push(lesson)
        grouped.set(lesson.courseId, list)
      })

    return grouped
  }, [lessons])

  const allLessonIds = useMemo(
    () => sortedCourses.flatMap((course) => (lessonsByCourse.get(course.id) ?? []).map((lesson) => lesson.id)),
    [sortedCourses, lessonsByCourse]
  )

  const effective = selected ?? new Set(allLessonIds)
  const allSelected = allLessonIds.length > 0 && effective.size === allLessonIds.length

  const toggleLesson = (lessonId: string) => {
    const next = new Set(effective)

    if (next.has(lessonId)) {
      next.delete(lessonId)
    } else {
      next.add(lessonId)
    }

    setSelected(next)
  }

  const toggleCourse = (courseId: string, checked: boolean) => {
    const next = new Set(effective)

    ;(lessonsByCourse.get(courseId) ?? []).forEach((lesson) => {
      if (checked) {
        next.add(lesson.id)
      } else {
        next.delete(lesson.id)
      }
    })

    setSelected(next)
  }

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(allLessonIds) : new Set())
  }

  const handleExport = async () => {
    if (effective.size === 0) return

    setError(null)

    try {
      await exportBackupFx([...effective])
      popScreen()
    } catch {
      setError('Не удалось сохранить файл')
    }
  }

  return (
    <Box grow height="100%">
      <Header back text="Экспорт" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        {allLessonIds.length === 0 ? (
          <EmptyScreen
            fullHeight
            icon={<IconEducation fontSize={24} />}
            text="Пока нет уроков для экспорта"
          />
        ) : (
          <Stack spacing="m" height="100%">
            <Card padding="m">
              <Stack spacing="l">
                <Checkbox checked={allSelected} label="Выбрать все" onChange={toggleAll} />
                {sortedCourses.map((course) => {
                  const courseLessons = lessonsByCourse.get(course.id) ?? []
                  const courseChecked = courseLessons.some((lesson) => effective.has(lesson.id))

                  return (
                    <Stack key={course.id} spacing="s">
                      <Checkbox
                        checked={courseChecked}
                        disabled={courseLessons.length === 0}
                        label={course.name}
                        onChange={(value) => toggleCourse(course.id, value)}
                      />
                      <div className={classes.lessons}>
                        {courseLessons.map((lesson) => (
                          <Checkbox
                            key={lesson.id}
                            checked={effective.has(lesson.id)}
                            label={lesson.name}
                            onChange={() => toggleLesson(lesson.id)}
                          />
                        ))}
                      </div>
                    </Stack>
                  )
                })}
              </Stack>
            </Card>

            {error ? <FormHelperText variant="error">{error}</FormHelperText> : null}

            <Button
              disabled={effective.size === 0}
              fullWidth
              loading={exporting}
              startIcon={<IconDownload fontSize={24} />}
              onClick={handleExport}
            >
              Экспортировать
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  )
}
