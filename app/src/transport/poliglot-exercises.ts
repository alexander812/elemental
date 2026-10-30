import { POLIGLOT_EXERCISES, POLIGLOT_EXERCISES_LESSON_NAME } from '../courses/poliglot/exercises'
import { load, save } from '../lib/storage'
import type { CardSet, Course, Lesson } from '../lib/types'

export function ensurePoliglotExercises(): void {
  const courses = load<Course[]>('courses', []).filter((course) => course.kind === 'poliglot')
  if (courses.length === 0) return

  const lessons = load<Lesson[]>('lessons', [])
  const sets = load<CardSet[]>('sets', [])
  let lessonsChanged = false
  let setsChanged = false

  for (const course of courses) {
    const lessonId = `${course.id}:poliglot-exercises`
    let lesson = lessons.find(
      (item) =>
        item.courseId === course.id &&
        (item.id === lessonId ||
          item.id.endsWith(':poliglot-exercises') ||
          item.name === POLIGLOT_EXERCISES_LESSON_NAME)
    )
    if (!lesson) {
      lesson = {
        id: lessonId,
        courseId: course.id,
        name: POLIGLOT_EXERCISES_LESSON_NAME,
        order: Math.max(
          16,
          ...lessons.filter((item) => item.courseId === course.id).map((item) => item.order + 1)
        ),
      }
      lessons.push(lesson)
      lessonsChanged = true
    }

    const exerciseLessonId = lesson.id
    for (const [order, category] of POLIGLOT_EXERCISES.entries()) {
      const setId = `${exerciseLessonId}:${category.id}`
      if (
        sets.some(
          (set) =>
            set.lessonId === exerciseLessonId &&
            (set.id.endsWith(`:${category.id}`) || set.name === category.name)
        )
      )
        continue
      sets.push({
        id: setId,
        lessonId: exerciseLessonId,
        name: category.name,
        active: true,
        order,
        swapped: false,
        examPassed: false,
        texts: {},
        cards: category.cards.map((card, index) => ({
          id: `${setId}:${index}`,
          texts: { ru: card.original, en: card.translation },
          learned: false,
          deleted: false,
          voiceCheck: null,
          writeCheck: null,
        })),
        phraseTask: { pages: category.pages, pageIndex: 0, solved: [] },
      })
      setsChanged = true
    }
  }

  if (lessonsChanged) save('lessons', lessons)
  if (setsChanged) save('sets', sets)
}
