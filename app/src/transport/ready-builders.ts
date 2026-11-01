import poliglot from '../courses/poliglot/course_poliglot.en.json'
import type { PoliglotLessonData } from '../courses/poliglot/lesson-one'
import type { CardSet, Course, Lesson } from '../lib/types'
import { fetchCatalogCourse } from './catalog'

export async function buildReadyContent(course: Course): Promise<{
  lessons: Lesson[]
  sets: CardSet[]
}> {
  const source = course.source
  if (!source) return { lessons: [], sets: [] }

  if (source.kind === 'poliglot') {
    return {
      lessons: poliglot.lessons.map((lesson) => ({
        id: `${course.id}:lesson:${lesson.id}`,
        courseId: course.id,
        name: lesson.name,
        order: lesson.order,
      })),
      // Lightweight task metadata keeps lesson counts and saved completion visible.
      sets: poliglot.lessons.flatMap((lesson) =>
        lesson.tasks.map((task, order) => ({
          id: `${course.id}:lesson:${lesson.id}:set:${task.id}`,
          lessonId: `${course.id}:lesson:${lesson.id}`,
          name: task.name,
          active: true,
          order,
          swapped: false,
          examPassed: false,
          texts: {},
          cards: [],
        }))
      ),
    }
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

const poliglotFiles = import.meta.glob<string>('../courses/poliglot/course_poliglot_*.en.json', {
  query: '?url',
  import: 'default',
  eager: true,
})

export async function buildReadyLesson(course: Course, lessonId: string): Promise<CardSet[]> {
  const lesson = poliglot.lessons.find((item) => `${course.id}:lesson:${item.id}` === lessonId)
  if (course.source?.kind !== 'poliglot' || !lesson) return []
  const url = poliglotFiles[`../courses/poliglot/${lesson.file}`]
  if (!url) throw new Error('poliglot_lesson_not_found')
  const response = await fetch(url)
  if (!response.ok) throw new Error('poliglot_download_failed')
  const data = await response.json()
  if (lesson.kind === 'exercises') {
    const { parseExercises } = await import('../courses/poliglot/exercises')
    return parseExercises(data).map((category, order) => {
      const setId = `${lessonId}:set:${category.id}`
      return {
        id: setId,
        lessonId,
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
      }
    })
  }
  const { parseLessonOne } = await import('../courses/poliglot/lesson-one')
  return parseLessonOne(data as PoliglotLessonData).map((task, order) => ({
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
}
