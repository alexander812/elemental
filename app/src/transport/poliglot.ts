import type { Course } from '../lib/types'
import { uid } from '../lib/uid'
import { fetchCourses, replaceCourses } from './courses'
import { fetchLessons } from './lessons'
import { fetchSets } from './sets'
import { POLIGLOT_METADATA } from './poliglot-metadata'

export async function loadPoliglot() {
  const courses = await fetchCourses()
  const existing = courses.find((course) => course.source?.kind === 'poliglot')

  if (existing) {
    return {
      courses,
      lessons: await fetchLessons(),
      sets: await fetchSets(),
      courseId: existing.id,
      added: false,
    }
  }

  const course: Course = {
    id: uid(),
    ...POLIGLOT_METADATA,
    kind: 'poliglot',
    source: { kind: 'poliglot' },
    order: Math.max(-1, ...courses.map((item) => item.order)) + 1,
  }
  const savedCourses = await replaceCourses([...courses, course])

  return {
    courses: savedCourses,
    lessons: await fetchLessons(),
    sets: await fetchSets(),
    courseId: course.id,
    added: true,
  }
}
