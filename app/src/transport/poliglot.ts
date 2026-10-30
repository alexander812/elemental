import { POLIGLOT_LESSON_NAME, POLIGLOT_LESSON_ONE } from '../courses/poliglot/lesson-one'
import type { CardSet, Course, Lesson } from '../lib/types'
import { uid } from '../lib/uid'
import { fetchCourses, replaceCourses } from './courses'
import { fetchLessons, replaceLessons } from './lessons'
import { fetchSets, replaceSets } from './sets'

export async function loadPoliglot() {
  const [courses, lessons, sets] = await Promise.all([fetchCourses(), fetchLessons(), fetchSets()])
  const existing = courses.find((course) => course.kind === 'poliglot')

  if (existing) return { courses, lessons, sets, courseId: existing.id, added: false }

  const course: Course = {
    id: uid(),
    name: 'Полиглот',
    kind: 'poliglot',
    description: 'Простые фразы на английском: настоящее, прошлое и будущее.',
    lang: 'en',
    userLang: 'ru',
    order: Math.max(-1, ...courses.map((item) => item.order)) + 1,
  }
  const lesson: Lesson = {
    id: uid(),
    courseId: course.id,
    name: POLIGLOT_LESSON_NAME,
    order: 0,
  }
  const tasks: CardSet[] = POLIGLOT_LESSON_ONE.map((task, order) => ({
    id: uid(),
    lessonId: lesson.id,
    name: task.name,
    active: true,
    order,
    swapped: false,
    examPassed: false,
    texts: {},
    cards: [],
    phraseTask: { pages: task.pages, pageIndex: 0, solved: [] },
  }))

  const savedCourses = await replaceCourses([...courses, course])
  await replaceLessons([...lessons, lesson])
  await replaceSets([...sets, ...tasks])

  return {
    courses: savedCourses,
    lessons: await fetchLessons(),
    sets: await fetchSets(),
    courseId: course.id,
    added: true,
  }
}
