import type { Lesson } from '../lib/types'
import { uid } from '../lib/uid'
import {
  ensureReadyCourse,
  ensureReadyLesson,
  readContentLessons,
  writeContentLessons,
} from './ready-content'

export type { Lesson } from '../lib/types'

export function readLessons(): Lesson[] {
  return readContentLessons()
}

function writeLessons(lessons: Lesson[]): Lesson[] {
  return writeContentLessons(lessons)
}

export async function fetchLessons(): Promise<Lesson[]> {
  return readLessons()
}

export async function replaceLessons(lessons: Lesson[]): Promise<Lesson[]> {
  return writeLessons(lessons)
}

export async function createLesson(payload: {
  courseId: string
  name: string
}): Promise<{ lessonId: string; lessons: Lesson[] }> {
  await ensureReadyCourse(payload.courseId)
  const lessons = readLessons()
  const maxOrder = lessons.reduce((max, lesson) => Math.max(max, lesson.order), -1)
  const lesson: Lesson = {
    id: uid(),
    courseId: payload.courseId,
    name: payload.name.trim(),
    order: maxOrder + 1,
  }

  return { lessonId: lesson.id, lessons: writeLessons([...lessons, lesson]) }
}

export async function updateLesson(payload: {
  lessonId: string
  courseId: string
  name: string
}): Promise<Lesson[]> {
  await ensureReadyLesson(payload.lessonId)
  await ensureReadyCourse(payload.courseId)
  const lessons = readLessons()

  return writeLessons(
    lessons.map((lesson) =>
      lesson.id === payload.lessonId
        ? {
            ...lesson,
            courseId: payload.courseId,
            name: payload.name.trim(),
          }
        : lesson
    )
  )
}

export async function deleteLesson(lessonId: string): Promise<Lesson[]> {
  const lessons = readLessons()

  return writeLessons(lessons.filter((lesson) => lesson.id !== lessonId))
}

export async function reorderLessons(ids: string[]): Promise<Lesson[]> {
  const lessons = readLessons()
  const orderMap = new Map(ids.map((id, index) => [id, index]))

  return writeLessons(
    lessons.map((lesson) => {
      const order = orderMap.get(lesson.id)
      return order === undefined ? lesson : { ...lesson, order }
    })
  )
}
