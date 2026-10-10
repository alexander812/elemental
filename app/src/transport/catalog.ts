import type { LanguageCode } from '../lib/languages'
import type { Card, CardSet, CardTexts, Course, CourseLevel, Lesson } from '../lib/types'
import { uid } from '../lib/uid'
import { fetchCourses, replaceCourses } from './courses'
import { fetchLessons, replaceLessons } from './lessons'
import { fetchSets, replaceSets } from './sets'

export type CatalogTexts = Partial<Record<LanguageCode, string>>

export type CatalogCourseEntry = {
  course: string
  level: string
  files: Partial<Record<LanguageCode, string>>
  i18n: {
    course: CatalogTexts
    description: CatalogTexts
  }
}

export type CatalogTask = {
  name: string
  text: string
  words: string[]
}

export type CatalogLesson = {
  name: string
  tasks: CatalogTask[]
}

export type CatalogCourseData = {
  parentCourse: string
  lang: LanguageCode
  lessons: CatalogLesson[]
}

export type ReadyCourses = {
  courses: Course[]
  lessons: Lesson[]
  sets: CardSet[]
}

const LEVEL_FILES: Record<CourseLevel, string> = {
  beginner: 'courses_beginner.json',
  elementary: 'courses_elementary.json',
  intermediate: 'courses_intermediate.json',
  'upper-intermediate': 'courses_upper_intermediate.json',
}

const levelModules = import.meta.glob('../courses/courses_*.json')
const courseModules = import.meta.glob('../courses/course_*.json')

async function loadJson<T>(loader: (() => Promise<unknown>) | undefined): Promise<T> {
  if (!loader) throw new Error('catalog_not_found')

  const module = await loader()
  const data = (module as { default?: unknown }).default

  if (typeof data !== 'object' || data === null) throw new Error('catalog_invalid')

  return data as T
}

export async function fetchLevelCatalog(level: CourseLevel): Promise<CatalogCourseEntry[]> {
  const data = await loadJson<{ courses?: unknown }>(
    levelModules[`../courses/${LEVEL_FILES[level]}`]
  )

  if (!Array.isArray(data.courses)) throw new Error('catalog_invalid')

  return data.courses as CatalogCourseEntry[]
}

export async function fetchCatalogCourse(file: string): Promise<CatalogCourseData> {
  const data = await loadJson<CatalogCourseData>(courseModules[`../courses/${file}`])

  if (!Array.isArray(data.lessons)) throw new Error('catalog_invalid')

  return data
}

function pickText(
  texts: CatalogTexts | undefined,
  preferred: LanguageCode,
  fallback: LanguageCode
): string {
  return texts?.[preferred] ?? texts?.[fallback] ?? ''
}

function buildSet(
  task: CatalogTask,
  userTask: CatalogTask | undefined,
  lessonId: string,
  order: number,
  payload: { lang: LanguageCode; userLang: LanguageCode }
): CardSet {
  const originals = userTask?.words ?? []
  const translations = task.words ?? []
  const count = Math.min(originals.length, translations.length)
  const cards: Card[] = []

  for (let index = 0; index < count; index += 1) {
    const original = originals[index]?.trim() ?? ''
    const translation = translations[index]?.trim() ?? ''

    if (!original || !translation) continue

    cards.push({
      id: uid(),
      texts: { [payload.userLang]: original, [payload.lang]: translation },
      learned: false,
      deleted: false,
      voiceCheck: null,
      writeCheck: null,
    })
  }

  const setTexts: CardTexts = {}

  if (userTask?.text) setTexts[payload.userLang] = userTask.text
  if (task.text) setTexts[payload.lang] = task.text

  return {
    id: uid(),
    lessonId,
    name: userTask?.name || task.name,
    active: true,
    order,
    swapped: false,
    examPassed: false,
    texts: setTexts,
    cards,
  }
}

export async function buildReadyCourses(payload: {
  entries: CatalogCourseEntry[]
  level: CourseLevel
  lang: LanguageCode
  userLang: LanguageCode
}): Promise<ReadyCourses> {
  const courses: Course[] = []
  const lessons: Lesson[] = []
  const sets: CardSet[] = []

  for (const entry of payload.entries) {
    const langFile = entry.files?.[payload.lang]

    if (!langFile) continue

    const userLangFile = entry.files?.[payload.userLang]
    const data = await fetchCatalogCourse(langFile)
    const userData =
      userLangFile && userLangFile !== langFile ? await fetchCatalogCourse(userLangFile) : data
    const course: Course = {
      id: uid(),
      name: pickText(entry.i18n?.course, payload.userLang, payload.lang) || entry.course,
      description: pickText(entry.i18n?.description, payload.userLang, payload.lang),
      order: courses.length,
      lang: payload.lang,
      level: payload.level,
    }

    courses.push(course)

    let lessonIndex = 0

    for (const lesson of data.lessons) {
      const userLesson = userData.lessons[lessonIndex]
      lessonIndex += 1

      const model: Lesson = {
        id: uid(),
        courseId: course.id,
        name: userLesson?.name || lesson.name,
        order: lessons.filter((item) => item.courseId === course.id).length,
      }

      lessons.push(model)

      let taskIndex = 0

      for (const task of lesson.tasks ?? []) {
        const userTask = userLesson?.tasks?.[taskIndex]
        taskIndex += 1

        sets.push(
          buildSet(
            task,
            userTask,
            model.id,
            sets.filter((item) => item.lessonId === model.id).length,
            payload
          )
        )
      }
    }
  }

  return { courses, lessons, sets }
}

export function findReadyCourseDuplicates(
  ready: ReadyCourses,
  existing: Course[],
  level: CourseLevel
): Course[] {
  return ready.courses.filter((course) =>
    existing.some((item) => item.level === level && item.name === course.name)
  )
}

export async function applyReadyCourses(
  ready: ReadyCourses,
  level: CourseLevel
): Promise<ReadyCourses> {
  const existingCourses = await fetchCourses()
  const incomingNames = new Set(ready.courses.map((course) => course.name))
  const removedCourses = existingCourses.filter(
    (course) => course.level === level && incomingNames.has(course.name)
  )
  const removedCourseIds = new Set(removedCourses.map((course) => course.id))
  const existingLessons = await fetchLessons()
  const removedLessonIds = new Set(
    existingLessons
      .filter((lesson) => removedCourseIds.has(lesson.courseId))
      .map((lesson) => lesson.id)
  )
  const existingSets = await fetchSets()
  const maxOrder = existingCourses.reduce((max, course) => Math.max(max, course.order), -1)
  const courses = [
    ...existingCourses.filter((course) => !removedCourseIds.has(course.id)),
    ...ready.courses.map((course, index) => ({ ...course, order: maxOrder + 1 + index })),
  ]
  const lessons = [
    ...existingLessons.filter((lesson) => !removedLessonIds.has(lesson.id)),
    ...ready.lessons,
  ]
  const sets = [
    ...existingSets.filter((set) => !removedLessonIds.has(set.lessonId)),
    ...ready.sets,
  ]
  const savedCourses = await replaceCourses(courses)
  const savedLessons = await replaceLessons(lessons)
  const savedSets = await replaceSets(sets)

  return { courses: savedCourses, lessons: savedLessons, sets: savedSets }
}
