import { DEFAULT_COURSE_LANG, DEFAULT_USER_LANG, LANGUAGES_CATALOG } from '../lib/languages'
import type { Language, LanguageCode } from '../lib/languages'
import type { CardSet, CardTexts, Course, Lesson, Settings } from '../lib/types'
import { uid } from '../lib/uid'
import {
  createDefaultCourse,
  fetchCourses,
  migrateCourse,
  replaceCourses,
} from './courses'
import type { LegacyCourse } from './courses'
import { DEFAULT_LESSON_NAME, fetchLessons, migrateLesson, replaceLessons } from './lessons'
import type { LegacyLesson } from './lessons'
import { fetchSettings, saveSettings } from './settings'
import { fetchSets, migrateCard, migrateSet, replaceSets } from './sets'
import type { LegacyCard, LegacySet } from './sets'

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

const parseTexts = (value: unknown): CardTexts | undefined => {
  if (!isRecord(value)) return undefined

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  )

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

const parseLegacyCard = (value: unknown): LegacyCard | null => {
  if (!isRecord(value)) return null

  const texts = parseTexts(value.texts)

  if (!texts && typeof value.original !== 'string' && typeof value.translation !== 'string') {
    return null
  }

  return {
    deleted: value.deleted === true,
    id: typeof value.id === 'string' && value.id ? value.id : uid(),
    learned: value.learned === true,
    original: typeof value.original === 'string' ? value.original : undefined,
    originalLang: typeof value.originalLang === 'string' ? value.originalLang : undefined,
    texts,
    translation: typeof value.translation === 'string' ? value.translation : undefined,
    translationLang: typeof value.translationLang === 'string' ? value.translationLang : undefined,
    voiceCheck: typeof value.voiceCheck === 'boolean' ? value.voiceCheck : null,
    writeCheck: typeof value.writeCheck === 'boolean' ? value.writeCheck : null,
  }
}

const parseSets = (value: unknown): LegacySet[] => {
  if (!Array.isArray(value)) throw new Error('invalid backup: sets')

  return value.map((raw, index) => {
    if (!isRecord(raw)) throw new Error('invalid backup: set')

    const cards = Array.isArray(raw.cards)
      ? raw.cards
          .map(parseLegacyCard)
          .filter((card): card is LegacyCard => card !== null)
          .map(migrateCard)
          .filter((card) =>
            Object.values(card.texts).some((text) => (text ?? '').trim().length > 0)
          )
      : []

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      lessonId: typeof raw.lessonId === 'string' && raw.lessonId ? raw.lessonId : undefined,
      name:
        typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : `Задание ${index + 1}`,
      active: raw.active !== false,
      order: typeof raw.order === 'number' ? raw.order : index,
      originalLang: typeof raw.originalLang === 'string' ? raw.originalLang : undefined,
      translationLang: typeof raw.translationLang === 'string' ? raw.translationLang : undefined,
      texts: parseTexts(raw.texts) ?? {},
      cards,
    }
  })
}

const parseCourses = (value: unknown, fallbackLang: LanguageCode): Course[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter(isRecord)
    .map((raw, index) =>
      migrateCourse(
        {
          id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
          name: typeof raw.name === 'string' ? raw.name : undefined,
          description: typeof raw.description === 'string' ? raw.description : undefined,
          order: typeof raw.order === 'number' ? raw.order : undefined,
          lang: typeof raw.lang === 'string' ? raw.lang : undefined,
          originalLang: typeof raw.originalLang === 'string' ? raw.originalLang : undefined,
          translationLang: typeof raw.translationLang === 'string' ? raw.translationLang : undefined,
        } satisfies LegacyCourse,
        index,
        fallbackLang
      )
    )
}

const parseLessons = (value: unknown): LegacyLesson[] => {
  if (!Array.isArray(value)) return []

  return value.filter(isRecord).map((raw) => ({
    id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
    courseId: typeof raw.courseId === 'string' && raw.courseId ? raw.courseId : undefined,
    name: typeof raw.name === 'string' ? raw.name : undefined,
    order: typeof raw.order === 'number' ? raw.order : undefined,
    originalLang: typeof raw.originalLang === 'string' ? raw.originalLang : undefined,
    translationLang: typeof raw.translationLang === 'string' ? raw.translationLang : undefined,
  }))
}

const linkData = (
  rawCourses: Course[],
  rawLessons: LegacyLesson[],
  rawSets: LegacySet[],
  settings: Settings,
  legacyCourseLang: LanguageCode
): { courses: Course[]; lessons: Lesson[]; sets: CardSet[] } => {
  let courses = rawCourses

  if (courses.length === 0 && (rawLessons.length > 0 || rawSets.length > 0)) {
    const first = rawLessons[0]

    courses = [createDefaultCourse(first?.translationLang ?? legacyCourseLang)]
  }

  const courseIds = new Set(courses.map((course) => course.id))
  const fallbackCourseId = courses[0]?.id ?? ''
  const migratedLessons = rawLessons.map((lesson, index) =>
    migrateLesson(
      {
        ...lesson,
        courseId:
          lesson.courseId && courseIds.has(lesson.courseId) ? lesson.courseId : undefined,
      },
      index,
      fallbackCourseId
    )
  )
  const lessons =
    migratedLessons.length === 0 && rawSets.length > 0
      ? [
          {
            id: uid(),
            courseId: fallbackCourseId,
            name: DEFAULT_LESSON_NAME,
            order: 0,
          },
        ]
      : migratedLessons
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const fallbackLessonId = lessons[0]?.id ?? ''
  const courseIdByLesson = new Map(lessons.map((lesson) => [lesson.id, lesson.courseId]))
  const langByCourse = new Map(courses.map((course) => [course.id, course.lang]))
  const sets = rawSets.map((set) => {
    const lessonId = set.lessonId && lessonIds.has(set.lessonId) ? set.lessonId : fallbackLessonId
    const courseLang = langByCourse.get(courseIdByLesson.get(lessonId) ?? '') ?? legacyCourseLang

    return migrateSet({ ...set, lessonId }, settings.userLang, courseLang, fallbackLessonId)
  })

  return { courses, lessons, sets }
}

const CATALOG_CODES = new Set(LANGUAGES_CATALOG.map((language) => language.code))

const parseSettings = (value: unknown): { settings: Settings; legacyCourseLang: LanguageCode } => {
  const raw = isRecord(value) ? value : {}

  const userLang = CATALOG_CODES.has(raw.userLang as string)
    ? (raw.userLang as LanguageCode)
    : CATALOG_CODES.has(raw.originalLang as string)
      ? (raw.originalLang as LanguageCode)
      : DEFAULT_USER_LANG
  const legacyCourseLang = CATALOG_CODES.has(raw.translationLang as string)
    ? (raw.translationLang as LanguageCode)
    : DEFAULT_COURSE_LANG

  return {
    settings: {
      theme: raw.theme === 'light' ? 'light' : 'dark',
      userLang,
      learnAfterChecks: raw.learnAfterChecks === true,
    },
    legacyCourseLang,
  }
}

export function parseBackup(raw: string): BackupData {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('invalid backup: not json')
  }

  if (Array.isArray(parsed)) {
    const { settings, legacyCourseLang } = parseSettings(undefined)
    const { courses, lessons, sets } = linkData(
      [],
      [],
      parseSets(parsed),
      settings,
      legacyCourseLang
    )

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      courses,
      lessons,
      sets,
      languages: LANGUAGES_CATALOG,
      settings,
    }
  }

  if (!isRecord(parsed)) throw new Error('invalid backup: root')

  const { settings, legacyCourseLang } = parseSettings(parsed.settings)
  const { courses, lessons, sets } = linkData(
    parseCourses(parsed.courses, legacyCourseLang),
    parseLessons(parsed.lessons),
    parseSets(parsed.sets),
    settings,
    legacyCourseLang
  )

  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    courses,
    lessons,
    sets,
    languages: LANGUAGES_CATALOG,
    settings,
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
    version: 4,
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
