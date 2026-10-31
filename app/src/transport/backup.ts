import { LANGUAGES_CATALOG } from '../lib/languages'
import type { Language } from '../lib/languages'
import type { CardSet, Course, Lesson, Settings } from '../lib/types'
import { uid } from '../lib/uid'
import { fetchCourses, replaceCourses } from './courses'
import { fetchLessons, replaceLessons } from './lessons'
import { fetchSettings, saveSettings } from './settings'
import { fetchSets, replaceSets } from './sets'
import {
  clearReadyContentCache,
  readContentLessons,
  readContentSets,
  readReadyStates,
  remapReadyState,
  writeReadyStates,
} from './ready-content'
import type { ReadyCourseState } from './ready-content'

export const BACKUP_VERSION = 10

export type BackupData = {
  version: number
  exportedAt: string
  courses: Course[]
  lessons: Lesson[]
  sets: CardSet[]
  readyStates: Record<string, ReadyCourseState>
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
  readyCourse?: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function sameCourse(a: Course, b: Course): boolean {
  if (!a.source || !b.source) {
    return !a.source && !b.source && a.name === b.name && a.kind === b.kind
  }

  if (a.lang !== b.lang || a.userLang !== b.userLang || a.source.kind !== b.source.kind)
    return false

  return (
    a.source.kind === 'poliglot' ||
    (b.source.kind === 'catalog' && a.source.courseKey === b.source.courseKey)
  )
}

function parseReadyStates(value: unknown): Record<string, ReadyCourseState> {
  if (!isRecord(value)) throw new Error('invalid backup: ready states')
  for (const state of Object.values(value)) {
    if (!isRecord(state) || !Array.isArray(state.patches) || !isRecord(state.summary))
      throw new Error('invalid backup: ready state')
    const { total, completed } = state.summary
    if (
      !Number.isInteger(total) ||
      !Number.isInteger(completed) ||
      (total as number) < 0 ||
      (completed as number) < 0 ||
      (completed as number) > (total as number)
    )
      throw new Error('invalid backup: ready summary')
    for (const patch of state.patches) {
      if (
        !isRecord(patch) ||
        !Array.isArray(patch.path) ||
        patch.path.length === 0 ||
        !['lessons', 'sets'].includes(patch.path[0] as string) ||
        !patch.path.every((part: unknown) =>
          typeof part === 'string'
            ? !['__proto__', 'prototype', 'constructor'].includes(part)
            : typeof part === 'number' && Number.isInteger(part) && part >= 0
        ) ||
        (patch.remove !== undefined && typeof patch.remove !== 'boolean')
      )
        throw new Error('invalid backup: ready patch')
    }
  }
  return value as Record<string, ReadyCourseState>
}

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
    readyStates: parseReadyStates(parsed.readyStates ?? {}),
    languages: LANGUAGES_CATALOG,
    settings: parsed.settings as unknown as Settings,
  }
}

export async function createBackup(
  lessonIds?: string[],
  readyCourseIds?: string[]
): Promise<string> {
  const [allCourses, settings] = await Promise.all([fetchCourses(), fetchSettings()])
  const readyIds = new Set(allCourses.filter((course) => course.source).map((course) => course.id))
  const allLessons = readContentLessons()
  const allSets = readContentSets()

  const chosenLessons = lessonIds
    ? allLessons.filter((lesson) => lessonIds.includes(lesson.id))
    : allLessons
  const lessons = chosenLessons.filter((lesson) => !readyIds.has(lesson.courseId))
  const selectedLessonIds = new Set(lessons.map((lesson) => lesson.id))
  const sets = allSets.filter((set) => selectedLessonIds.has(set.lessonId))
  const selectedCourseIds = new Set(lessons.map((lesson) => lesson.courseId))
  const selectedReadyIds =
    readyCourseIds ??
    (lessonIds
      ? chosenLessons
          .filter((lesson) => readyIds.has(lesson.courseId))
          .map((lesson) => lesson.courseId)
      : [...readyIds])
  for (const id of selectedReadyIds) if (readyIds.has(id)) selectedCourseIds.add(id)
  const courses = allCourses.filter((course) => selectedCourseIds.has(course.id))
  const states = readReadyStates()
  const readyStates = Object.fromEntries(
    courses
      .filter((course) => course.source)
      .map((course) => [
        course.id,
        states[course.id] ?? {
          patches: [],
          summary: course.contentSummary ?? { total: 0, completed: 0 },
        },
      ])
  )

  const data: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    courses,
    lessons,
    sets,
    readyStates,
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
    const duplicate = existingCourses.find((item) => sameCourse(item, course))

    if (duplicate) courseIdMap.set(course.id, duplicate.id)
  }

  const duplicates: DuplicateLesson[] = []

  for (const course of data.courses) {
    if (course.source && courseIdMap.has(course.id))
      duplicates.push({ courseName: course.name, name: course.name, readyCourse: true })
  }

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
    clearReadyContentCache()
    writeReadyStates(data.readyStates)
    const courses = await replaceCourses(data.courses)
    const lessons = await replaceLessons(data.lessons)
    const sets = await replaceSets(data.sets)
    const settings = await saveSettings(data.settings)

    return { courses, lessons, sets, settings }
  }

  const [existingCourses, allExistingLessons, allExistingSets, settings] = await Promise.all([
    fetchCourses(),
    fetchLessons(),
    fetchSets(),
    fetchSettings(),
  ])
  const readyCourseIds = new Set(
    existingCourses.filter((course) => course.source).map((course) => course.id)
  )
  const existingLessons = allExistingLessons.filter(
    (lesson) => !readyCourseIds.has(lesson.courseId)
  )
  const userLessonIds = new Set(existingLessons.map((lesson) => lesson.id))
  const existingSets = allExistingSets.filter((set) => userLessonIds.has(set.lessonId))

  const existingCourseIds = new Set(existingCourses.map((course) => course.id))
  const courseIdMap = new Map<string, string>()
  const newCourses: Course[] = []

  for (const course of data.courses) {
    const duplicate = existingCourses.find((item) => sameCourse(item, course))

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
          userLang: incoming.userLang,
          level: incoming.level ?? course.level,
          kind: incoming.kind,
          source: incoming.source,
          contentSummary: incoming.contentSummary,
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
      newLessons.push({
        ...lesson,
        id: duplicate.id,
        courseId: targetCourseId,
        order: duplicate.order,
      })
      continue
    }

    const id = existingLessonIds.has(lesson.id) ? uid() : lesson.id

    lessonIdMap.set(lesson.id, id)
    newLessons.push({ ...lesson, id, courseId: targetCourseId, order: nextOrder(targetCourseId) })
  }

  const keptLessons = existingLessons.filter((lesson) => !overwrittenLessonIds.has(lesson.id))
  const keptSets = existingSets.filter((set) => !overwrittenLessonIds.has(set.lessonId))
  const usedSetIds = new Set(keptSets.map((set) => set.id))
  const addedSets = data.sets.map((set) => {
    const id = usedSetIds.has(set.id) ? uid() : set.id
    usedSetIds.add(id)
    return { ...set, id, lessonId: lessonIdMap.get(set.lessonId) ?? set.lessonId }
  })
  const readyStates = readReadyStates()
  for (const course of data.courses) {
    if (!course.source) continue
    const targetId = courseIdMap.get(course.id) ?? course.id
    const state = data.readyStates[course.id] ?? {
      patches: [],
      summary: course.contentSummary ?? { total: 0, completed: 0 },
    }
    readyStates[targetId] = remapReadyState(state, course.id, targetId)
  }
  clearReadyContentCache()
  writeReadyStates(readyStates)
  const savedCourses = await replaceCourses([...courses, ...newCourses])
  const lessons = await replaceLessons([...keptLessons, ...newLessons])
  const sets = await replaceSets([...keptSets, ...addedSets])

  return { courses: savedCourses, lessons, sets, settings }
}
