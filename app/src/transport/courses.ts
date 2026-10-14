import type { LanguageCode } from '../lib/languages'
import { load, save } from '../lib/storage'
import type { Course } from '../lib/types'
import { uid } from '../lib/uid'

export type { Course } from '../lib/types'

const COURSES_KEY = 'courses'

export function readCourses(): Course[] {
  return load<Course[]>(COURSES_KEY, [])
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
  lang: LanguageCode
  userLang: LanguageCode
}): Promise<{ courseId: string; courses: Course[] }> {
  const courses = readCourses()
  const maxOrder = courses.reduce((max, course) => Math.max(max, course.order), -1)
  const course: Course = {
    id: uid(),
    name: payload.name.trim(),
    description: payload.description.trim(),
    order: maxOrder + 1,
    lang: payload.lang,
    userLang: payload.userLang,
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
