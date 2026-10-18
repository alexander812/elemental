import type { LanguageCode } from '../../lib/languages'
import type { CardSet, Lesson } from '../../lib/types'

export type TaskAnalyticsProperties = {
  set_id: string
  lesson_id: string
  course_id: string | null
  course_lang: LanguageCode
  user_lang: LanguageCode
}

export const taskAnalyticsProperties = (
  set: CardSet,
  lessons: Lesson[],
  courseLang: LanguageCode,
  userLang: LanguageCode
): TaskAnalyticsProperties => ({
  set_id: set.id,
  lesson_id: set.lessonId,
  course_id: lessons.find((lesson) => lesson.id === set.lessonId)?.courseId ?? null,
  course_lang: courseLang,
  user_lang: userLang,
})
