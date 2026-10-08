import { LANGUAGES_CATALOG } from '../lib/languages'
import type { Language } from '../lib/languages'
import type { CardSet, Course, Lesson, Settings } from '../lib/types'
import { uid } from '../lib/uid'
import { fetchCourses, replaceCourses } from './courses'
import { fetchLessons, replaceLessons } from './lessons'
import { fetchSettings, saveSettings } from './settings'
import { fetchSets, replaceSets } from './sets'

export const BACKUP_VERSION = 4

export type BackupData = {
  version: number
  exportedAt: string
  courses: Course[]
  lessons: Lesson[]
  sets: CardSet[]
  languages: Language[]
  settings: Settings
}

export type ImportMode = 'merge' | 'replace'

export type AppliedBackup = {
  courses: Course[]
  lessons: Lesson[]
  sets: CardSet[]
  settings: Settings
}

export type DuplicateLesson = {
  courseName: string
  name: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseBackup(raw: string): BackupData {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('invalid backup: not json')
  }

  if (!isRecord(parsed) || parsed.version !== BACKUP_VERSION) {
    throw new Error('invalid backup: unsupported version')
  }

  if (
    !Array.isArray(parsed.courses) ||
    !Array.isArray(parsed.lessons) ||
    !Array.isArray(parsed.sets) ||
    !isRecord(parsed.settings)
  ) {
    throw new Error('invalid backup: structure')
  }

  return {
    version: BACKUP_VERSION,
    exportedAt:
      typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    courses: parsed.courses as Course[],
    lessons: parsed.lessons as Lesson[],
    sets: parsed.sets as CardSet[],
    languages: LANGUAGES_CATALOG,
    settings: parsed.settings as unknown as Settings,
  }
}

export async function createBackup(lessonIds?: string[]): Promise<string> {
  const [allCourses, allLessons, allSets, settings] = await Promise.all([
    fetchCourses(),
    fetchLessons(),
    fetchSets(),
    fetchSettings(),
  ])

  const lessons = lessonIds
    ? allLessons.filter((lesson) => lessonIds.includes(lesson.id))
    : allLessons
  const selectedLessonIds = new Set(lessons.map((lesson) => lesson.id))
  const sets = allSets.filter((set) => selectedLessonIds.has(set.lessonId))
  const selectedCourseIds = new Set(lessons.map((lesson) => lesson.courseId))
  const courses = allCourses.filter((course) => selectedCourseIds.has(course.id))

  const data: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    courses,
    lessons,
    sets,
    languages: LANGUAGES_CATALOG,
    settings,
  }

  return JSON.stringify(data, null, 2)
}

export function downloadBackup(content: string): void {
  const stamp = new Date().toISOString().slice(0, 10)
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')

  link.download = `lexi-backup-${stamp}.json`
  link.href = url
  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function findDuplicateLessons(
  data: BackupData,
  existingCourses: Course[],
  existingLessons: Lesson[]
): DuplicateLesson[] {
  const courseIdMap = new Map<string, string>()

  for (const course of data.courses) {
    const duplicate = existingCourses.find((item) => item.name === course.name)

    if (duplicate) courseIdMap.set(course.id, duplicate.id)
  }

  const duplicates: DuplicateLesson[] = []

  for (const lesson of data.lessons) {
    const targetCourseId = courseIdMap.get(lesson.courseId)

    if (!targetCourseId) continue

    const duplicate = existingLessons.find(
      (item) => item.courseId === targetCourseId && item.name === lesson.name
    )

    if (!duplicate) continue

    const course = data.courses.find((item) => item.id === lesson.courseId)

    duplicates.push({ courseName: course?.name ?? '', name: lesson.name })
  }

  return duplicates
}

export async function applyBackup(data: BackupData, mode: ImportMode): Promise<AppliedBackup> {
  if (mode === 'replace') {
    const courses = await replaceCourses(data.courses)
    const lessons = await replaceLessons(data.lessons)
    const sets = await replaceSets(data.sets)
    const settings = await saveSettings(data.settings)

    return { courses, lessons, sets, settings }
  }

  const [existingCourses, existingLessons, existingSets, settings] = await Promise.all([
    fetchCourses(),
    fetchLessons(),
    fetchSets(),
    fetchSettings(),
  ])

  const existingCourseIds = new Set(existingCourses.map((course) => course.id))
  const courseIdMap = new Map<string, string>()
  const newCourses: Course[] = []

  for (const course of data.courses) {
    const duplicate = existingCourses.find((item) => item.name === course.name)

    if (duplicate) {
      courseIdMap.set(course.id, duplicate.id)
      continue
    }

    const id = existingCourseIds.has(course.id) ? uid() : course.id

    courseIdMap.set(course.id, id)
    newCourses.push({ ...course, id, order: existingCourses.length + newCourses.length })
  }

  const courses = existingCourses.map((course) => {
    const incoming = data.courses.find((item) => courseIdMap.get(item.id) === course.id)

    return incoming
      ? {
          ...course,
          name: incoming.name,
          description: incoming.description,
          lang: incoming.lang,
        }
      : course
  })

  const existingLessonIds = new Set(existingLessons.map((lesson) => lesson.id))
  const overwrittenLessonIds = new Set<string>()
  const lessonIdMap = new Map<string, string>()
  const newLessons: Lesson[] = []
  const orderCursor = new Map<string, number>()

  const nextOrder = (courseId: string): number => {
    if (!orderCursor.has(courseId)) {
      const max = existingLessons
        .filter((lesson) => lesson.courseId === courseId)
        .reduce((accumulator, lesson) => Math.max(accumulator, lesson.order), -1)

      orderCursor.set(courseId, max + 1)
    }

    const value = orderCursor.get(courseId) as number

    orderCursor.set(courseId, value + 1)

    return value
  }

  for (const lesson of data.lessons) {
    const targetCourseId = courseIdMap.get(lesson.courseId) ?? lesson.courseId
    const duplicate = existingLessons.find(
      (item) => item.courseId === targetCourseId && item.name === lesson.name
    )

    if (duplicate) {
      lessonIdMap.set(lesson.id, duplicate.id)
      overwrittenLessonIds.add(duplicate.id)
      continue
    }

    const id = existingLessonIds.has(lesson.id) ? uid() : lesson.id

    lessonIdMap.set(lesson.id, id)
    newLessons.push({ ...lesson, id, courseId: targetCourseId, order: nextOrder(targetCourseId) })
  }

  const keptLessons = existingLessons.filter((lesson) => !overwrittenLessonIds.has(lesson.id))
  const keptSets = existingSets.filter((set) => !overwrittenLessonIds.has(set.lessonId))
  const addedSets = data.sets.map((set) => ({
    ...set,
    lessonId: lessonIdMap.get(set.lessonId) ?? set.lessonId,
  }))
  const savedCourses = await replaceCourses([...courses, ...newCourses])
  const lessons = await replaceLessons([...keptLessons, ...newLessons])
  const sets = await replaceSets([...keptSets, ...addedSets])

  return { courses: savedCourses, lessons, sets, settings }
}
