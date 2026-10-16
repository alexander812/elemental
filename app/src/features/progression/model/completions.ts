import { getLessonTaskCounts } from '../../../lib/progress'
import type { CardSet, Course, Lesson, Progression } from '../../../lib/types'
import type { ProgressionEvent } from './progression'

export const buildCompletionEvents = (
  progression: Progression,
  sets: CardSet[],
  lessons: Lesson[],
  courses: Course[]
): ProgressionEvent[] => {
  const events: ProgressionEvent[] = []
  const taskCounts = getLessonTaskCounts(sets)
  const completedLessons = new Set<string>()

  for (const lesson of lessons) {
    const counts = taskCounts.get(lesson.id)

    if (!counts || counts.total === 0 || counts.passed !== counts.total) continue

    completedLessons.add(lesson.id)

    if (!progression.rewarded.lessons.includes(lesson.id)) {
      events.push({ type: 'lessonCompleted', lessonId: lesson.id })
    }
  }

  for (const course of courses) {
    const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id)

    if (courseLessons.length === 0) continue

    if (!courseLessons.every((lesson) => completedLessons.has(lesson.id))) continue

    if (progression.rewarded.courses.includes(course.id)) continue

    events.push({ type: 'courseCompleted', courseId: course.id, courseName: course.name })
  }

  return events
}
