import { DEFAULT_ORIGINAL_LANG, DEFAULT_TRANSLATION_LANG, LANGUAGES_CATALOG } from '../lib/languages'
import type { LanguageCode } from '../lib/languages'
import { load, save } from '../lib/storage'
import type { Course } from '../lib/types'
import { uid } from '../lib/uid'
import { readSettings } from './settings'

export type { Course } from '../lib/types'

const COURSES_KEY = 'courses'

export const DEFAULT_COURSE_NAME = 'Базовый курс'

export type LegacyCourse = Partial<Course> & {
  id?: string
  name?: string
}

export function createDefaultCourse(
  originalLang?: LanguageCode,
  translationLang?: LanguageCode
): Course {
  const settings = readSettings()

  return {
    id: uid(),
    name: DEFAULT_COURSE_NAME,
    description: '',
    order: 0,
    originalLang: originalLang ?? settings.originalLang,
    translationLang: translationLang ?? settings.translationLang,
  }
}

export function migrateCourse(
  course: LegacyCourse,
  index = 0,
  fallbackOriginal: LanguageCode = DEFAULT_ORIGINAL_LANG,
  fallbackTranslation: LanguageCode = DEFAULT_TRANSLATION_LANG
): Course {
  const originalLang =
    typeof course.originalLang === 'string' && course.originalLang
      ? course.originalLang
      : fallbackOriginal
  const fallbackSafe =
    fallbackTranslation === originalLang
      ? (LANGUAGES_CATALOG.find((language) => language.code !== originalLang)?.code ??
        DEFAULT_TRANSLATION_LANG)
      : fallbackTranslation
  const translationLang =
    typeof course.translationLang === 'string' && course.translationLang !== originalLang
      ? course.translationLang
      : fallbackSafe

  return {
    id: typeof course.id === 'string' && course.id ? course.id : uid(),
    name:
      typeof course.name === 'string' && course.name.trim() ? course.name.trim() : `Курс ${index + 1}`,
    description: typeof course.description === 'string' ? course.description : '',
    order: typeof course.order === 'number' ? course.order : index,
    originalLang,
    translationLang,
  }
}

export function readCourses(): Course[] {
  const raw = load<LegacyCourse[] | null>(COURSES_KEY, null)

  if (raw === null) {
    const course = createDefaultCourse()
    save(COURSES_KEY, [course])
    return [course]
  }

  const settings = readSettings()

  return raw.map((item, index) =>
    migrateCourse(item, index, settings.originalLang, settings.translationLang)
  )
}

export function ensureDefaultCourse(): Course {
  const courses = readCourses()

  if (courses.length > 0) {
    return [...courses].sort((a, b) => a.order - b.order)[0]
  }

  const course = createDefaultCourse()
  save(COURSES_KEY, [course])

  return course
}

function writeCourses(courses: Course[]): Course[] {
  save(COURSES_KEY, courses)
  return courses
}

export async function fetchCourses(): Promise<Course[]> {
  return readCourses()
}

export async function replaceCourses(courses: Course[]): Promise<Course[]> {
  return writeCourses(courses)
}

export async function createCourse(payload: {
  name: string
  description: string
  originalLang: LanguageCode
  translationLang: LanguageCode
}): Promise<{ courseId: string; courses: Course[] }> {
  const courses = readCourses()
  const maxOrder = courses.reduce((max, course) => Math.max(max, course.order), -1)
  const course: Course = {
    id: uid(),
    name: payload.name.trim(),
    description: payload.description.trim(),
    order: maxOrder + 1,
    originalLang: payload.originalLang,
    translationLang: payload.translationLang,
  }

  return { courseId: course.id, courses: writeCourses([...courses, course]) }
}

export async function updateCourse(payload: {
  courseId: string
  name: string
  description: string
  originalLang: LanguageCode
  translationLang: LanguageCode
}): Promise<Course[]> {
  const courses = readCourses()

  return writeCourses(
    courses.map((course) =>
      course.id === payload.courseId
        ? {
            ...course,
            name: payload.name.trim(),
            description: payload.description.trim(),
            originalLang: payload.originalLang,
            translationLang: payload.translationLang,
          }
        : course
    )
  )
}

export async function deleteCourse(courseId: string): Promise<Course[]> {
  const courses = readCourses()

  return writeCourses(courses.filter((course) => course.id !== courseId))
}
