import type { CardSet, Lesson } from './types'

export type ProgressCounts = {
  passed: number
  total: number
}

export const getLessonTaskCounts = (sets: CardSet[]): Map<string, ProgressCounts> => {
  const counts = new Map<string, ProgressCounts>()

  for (const set of sets) {
    if (!set.active) continue

    const current = counts.get(set.lessonId) ?? { passed: 0, total: 0 }
    current.total += 1
    if (set.examPassed) current.passed += 1
    counts.set(set.lessonId, current)
  }

  return counts
}

export const getCourseLessonCounts = (
  lessons: Lesson[],
  taskCounts: Map<string, ProgressCounts>
): Map<string, ProgressCounts> => {
  const counts = new Map<string, ProgressCounts>()

  for (const lesson of lessons) {
    const current = counts.get(lesson.courseId) ?? { passed: 0, total: 0 }
    current.total += 1

    const tasks = taskCounts.get(lesson.id)
    if (tasks && tasks.passed === tasks.total) current.passed += 1

    counts.set(lesson.courseId, current)
  }

  return counts
}

export const getProgressRatio = (counts: ProgressCounts | undefined): number =>
  counts !== undefined && counts.total > 0 ? counts.passed / counts.total : 0
