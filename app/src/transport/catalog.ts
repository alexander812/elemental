import type { LanguageCode } from '../lib/languages'
import type { CardSet, Course, CourseLevel, Lesson } from '../lib/types'
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
const courseUrls = import.meta.glob<string>('../courses/course_*.json', {
  eager: true,
  query: '?url',
  import: 'default',
})

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
  const url = courseUrls[`../courses/${file}`]
  if (!url) throw new Error('catalog_not_found')
  const response = await fetch(url)
  if (!response.ok) throw new Error('catalog_download_failed')
  const data = (await response.json()) as CatalogCourseData

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

export async function buildReadyCourses(payload: {
  entries: CatalogCourseEntry[]
  level: CourseLevel
  lang: LanguageCode
  userLang: LanguageCode
}): Promise<ReadyCourses> {
  const courses: Course[] = []

  for (const entry of payload.entries) {
    const langFile = entry.files[payload.lang]
    if (!langFile) continue

    courses.push({
      id: uid(),
      name: pickText(entry.i18n.course, payload.userLang, payload.lang) || entry.course,
      description: pickText(entry.i18n.description, payload.userLang, payload.lang),
      order: courses.length,
      lang: payload.lang,
      userLang: payload.userLang,
      level: payload.level,
      source: {
        kind: 'catalog',
        courseKey: entry.course,
        langFile,
        userLangFile: entry.files[payload.userLang] ?? langFile,
      },
    })
  }

  return { courses, lessons: [], sets: [] }
}

function isSameNameAndLang(a: Course, b: Course): boolean {
  return a.name === b.name && a.lang === b.lang
}

export function findReadyCourseDuplicates(
  ready: ReadyCourses,
  existing: Course[],
  level: CourseLevel
): Course[] {
  return ready.courses.filter((course) =>
    existing.some((item) => item.level === level && isSameNameAndLang(item, course))
  )
}

export async function applyReadyCourses(
  ready: ReadyCourses,
  level: CourseLevel
): Promise<ReadyCourses> {
  const existingCourses = await fetchCourses()
  const removedCourses = existingCourses.filter(
    (course) =>
      course.level === level &&
      ready.courses.some((incoming) => isSameNameAndLang(incoming, course))
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
  const sets = [...existingSets.filter((set) => !removedLessonIds.has(set.lessonId)), ...ready.sets]
  const savedCourses = await replaceCourses(courses)
  const savedLessons = await replaceLessons(lessons)
  const savedSets = await replaceSets(sets)

  return { courses: savedCourses, lessons: savedLessons, sets: savedSets }
}
