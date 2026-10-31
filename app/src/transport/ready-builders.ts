import poliglotUrl from '../courses/poliglot/course_poliglot.en.json?url'
import type { PoliglotCourseData } from '../courses/poliglot/lesson-one'
import type { CardSet, Course, Lesson } from '../lib/types'
import { fetchCatalogCourse } from './catalog'

export async function buildReadyContent(course: Course): Promise<{
  lessons: Lesson[]
  sets: CardSet[]
}> {
  const source = course.source
  if (!source) return { lessons: [], sets: [] }

  if (source.kind === 'poliglot') {
    const [lessonContent, exercises] = await Promise.all([
      import('../courses/poliglot/lesson-one'),
      import('../courses/poliglot/exercises'),
    ])
    const response = await fetch(poliglotUrl)
    if (!response.ok) throw new Error('poliglot_download_failed')
    const data = (await response.json()) as PoliglotCourseData
    const tasks = lessonContent.parseLessonOne(data.lessonOne)
    const categories = exercises.parseExercises(data.exercises)
    const lessonId = `${course.id}:lesson:0`
    const exerciseLessonId = `${course.id}:lesson:exercises`
    const lessons: Lesson[] = [
      { id: lessonId, courseId: course.id, name: data.lessonOne.name, order: 0 },
      {
        id: exerciseLessonId,
        courseId: course.id,
        name: data.exercises.name,
        order: 16,
      },
    ]
    const sets: CardSet[] = tasks.map((task, order) => ({
      id: `${lessonId}:set:${task.id}`,
      lessonId,
      name: task.name,
      active: true,
      order,
      swapped: false,
      examPassed: false,
      texts: {},
      cards: [],
      phraseTask: { pages: task.pages, pageIndex: 0, solved: [] },
    }))

    for (const [order, category] of categories.entries()) {
      const setId = `${exerciseLessonId}:set:${category.id}`
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
          id: `${setId}:card:${index}`,
          texts: { [course.userLang]: card.original, [course.lang]: card.translation },
          learned: false,
          deleted: false,
          voiceCheck: null,
          writeCheck: null,
        })),
        phraseTask: { pages: category.pages, pageIndex: 0, solved: [] },
      })
    }
    return { lessons, sets }
  }

  const data = await fetchCatalogCourse(source.langFile)
  const userData =
    source.userLangFile === source.langFile ? data : await fetchCatalogCourse(source.userLangFile)
  const lessons: Lesson[] = []
  const sets: CardSet[] = []

  for (const [lessonIndex, lesson] of data.lessons.entries()) {
    const userLesson = userData.lessons[lessonIndex]
    const lessonId = `${course.id}:lesson:${lessonIndex}`
    lessons.push({
      id: lessonId,
      courseId: course.id,
      name: userLesson?.name || lesson.name,
      order: lessonIndex,
    })

    for (const [taskIndex, task] of lesson.tasks.entries()) {
      const userTask = userLesson?.tasks[taskIndex]
      const setId = `${lessonId}:set:${taskIndex}`
      const count = Math.min(userTask?.words.length ?? 0, task.words.length)
      const cards: CardSet['cards'] = []
      for (let cardIndex = 0; cardIndex < count; cardIndex += 1) {
        const original = userTask!.words[cardIndex].trim()
        const translation = task.words[cardIndex].trim()
        if (!original || !translation) continue
        cards.push({
          id: `${setId}:card:${cardIndex}`,
          texts: { [course.userLang]: original, [course.lang]: translation },
          learned: false,
          deleted: false,
          voiceCheck: null,
          writeCheck: null,
        })
      }
      const texts: CardSet['texts'] = {}
      if (userTask?.text) texts[course.userLang] = userTask.text
      if (task.text) texts[course.lang] = task.text
      sets.push({
        id: setId,
        lessonId,
        name: userTask?.name || task.name,
        active: true,
        order: taskIndex,
        swapped: false,
        examPassed: false,
        texts,
        cards,
      })
    }
  }
  return { lessons, sets }
}
