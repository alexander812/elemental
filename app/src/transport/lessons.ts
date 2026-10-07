import { load, save } from '../lib/storage'
import type { Lesson } from '../lib/types'
import { uid } from '../lib/uid'
import { ensureDefaultCourse } from './courses'

export type { Lesson } from '../lib/types'

const LESSONS_KEY = 'lessons'

export const DEFAULT_LESSON_NAME = 'Урок 1'

export type LegacyLesson = Partial<Lesson> & {
  id?: string
  name?: string
  originalLang?: string
  translationLang?: string
}

export function createDefaultLesson(courseId?: string): Lesson {
  return {
    id: uid(),
    courseId: courseId ?? ensureDefaultCourse().id,
    name: DEFAULT_LESSON_NAME,
    order: 0,
  }
}

export function migrateLesson(
  lesson: LegacyLesson,
  index = 0,
  fallbackCourseId = ''
): Lesson {
  return {
    id: typeof lesson.id === 'string' && lesson.id ? lesson.id : uid(),
    courseId:
      typeof lesson.courseId === 'string' && lesson.courseId
        ? lesson.courseId
        : fallbackCourseId,
    name:
      typeof lesson.name === 'string' && lesson.name.trim() ? lesson.name.trim() : `Урок ${index + 1}`,
    order: typeof lesson.order === 'number' ? lesson.order : index,
  }
}

export function readLessons(): Lesson[] {
  const raw = load<LegacyLesson[] | null>(LESSONS_KEY, null)

  if (raw === null) {
    const lesson = createDefaultLesson()
    save(LESSONS_KEY, [lesson])
    return [lesson]
  }

  const fallbackCourseId = ensureDefaultCourse().id

  return raw.map((item, index) => migrateLesson(item, index, fallbackCourseId))
}

export function ensureDefaultLesson(): Lesson {
  const lessons = readLessons()

  if (lessons.length > 0) {
    return [...lessons].sort((a, b) => a.order - b.order)[0]
  }

  const lesson = createDefaultLesson()
  save(LESSONS_KEY, [lesson])

  return lesson
}

function writeLessons(lessons: Lesson[]): Lesson[] {
  save(LESSONS_KEY, lessons)
  return lessons
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
