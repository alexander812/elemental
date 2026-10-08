import { DEFAULT_COURSE_LANG } from '../lib/languages'
import type { LanguageCode } from '../lib/languages'
import { load, save } from '../lib/storage'
import type { Course } from '../lib/types'
import { uid } from '../lib/uid'

export type { Course } from '../lib/types'

const COURSES_KEY = 'courses'

export const DEFAULT_COURSE_NAME = 'Базовый курс'

export type LegacyCourse = Partial<Course> & {
  id?: string
  name?: string
  originalLang?: LanguageCode
  translationLang?: LanguageCode
}

export function createDefaultCourse(lang?: LanguageCode): Course {
  return {
    id: uid(),
    name: DEFAULT_COURSE_NAME,
    description: '',
    order: 0,
    lang: lang ?? DEFAULT_COURSE_LANG,
  }
}

export function migrateCourse(
  course: LegacyCourse,
  index = 0,
  fallbackLang: LanguageCode = DEFAULT_COURSE_LANG
): Course {
  const lang =
    typeof course.lang === 'string' && course.lang
      ? course.lang
      : typeof course.translationLang === 'string' && course.translationLang
        ? course.translationLang
        : fallbackLang

  return {
    id: typeof course.id === 'string' && course.id ? course.id : uid(),
    name:
      typeof course.name === 'string' && course.name.trim() ? course.name.trim() : `Курс ${index + 1}`,
    description: typeof course.description === 'string' ? course.description : '',
    order: typeof course.order === 'number' ? course.order : index,
    lang,
  }
}

export function readCourses(): Course[] {
  const raw = load<LegacyCourse[] | null>(COURSES_KEY, null)

  if (raw === null) {
    const course = migrateCourse(createDefaultCourse())

    save(COURSES_KEY, [course])
    return [course]
  }

  return raw.map((item, index) => migrateCourse(item, index))
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
  const normalized = courses.map((course) => migrateCourse(course, course.order))

  save(COURSES_KEY, normalized)

  return normalized
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
  lang: LanguageCode
}): Promise<{ courseId: string; courses: Course[] }> {
  const courses = readCourses()
  const maxOrder = courses.reduce((max, course) => Math.max(max, course.order), -1)
  const course: Course = {
    id: uid(),
    name: payload.name.trim(),
    description: payload.description.trim(),
    order: maxOrder + 1,
    lang: payload.lang,
  }

  return { courseId: course.id, courses: writeCourses([...courses, course]) }
}

export async function updateCourse(payload: {
  courseId: string
  name: string
  description: string
  lang: LanguageCode
}): Promise<Course[]> {
  const courses = readCourses()

  return writeCourses(
    courses.map((course) =>
      course.id === payload.courseId
        ? {
            ...course,
            name: payload.name.trim(),
            description: payload.description.trim(),
            lang: payload.lang,
          }
        : course
    )
  )
}

export async function deleteCourse(courseId: string): Promise<Course[]> {
  const courses = readCourses()

  return writeCourses(courses.filter((course) => course.id !== courseId))
}
