import { DEFAULT_ORIGINAL_LANG, LANGUAGES_CATALOG } from '../lib/languages'
import type { Language } from '../lib/languages'
import type { CardSet, CardTexts, Lesson, Settings } from '../lib/types'
import { uid } from '../lib/uid'
import { DEFAULT_LESSON_NAME, fetchLessons, migrateLesson, replaceLessons } from './lessons'
import type { LegacyLesson } from './lessons'
import { fetchSettings, saveSettings } from './settings'
import { fetchSets, migrateCard, migrateSet, replaceSets } from './sets'
import type { LegacyCard, LegacySet } from './sets'

export type BackupData = {
  version: number
  exportedAt: string
  lessons: Lesson[]
  sets: CardSet[]
  languages: Language[]
  settings: Settings
}

export type ImportMode = 'merge' | 'replace'

export type AppliedBackup = {
  lessons: Lesson[]
  sets: CardSet[]
  settings: Settings
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
        typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : `Набор ${index + 1}`,
      active: raw.active !== false,
      order: typeof raw.order === 'number' ? raw.order : index,
      originalLang: typeof raw.originalLang === 'string' ? raw.originalLang : undefined,
      translationLang: typeof raw.translationLang === 'string' ? raw.translationLang : undefined,
      cards,
    }
  })
}

const parseLessons = (value: unknown, settings: Settings): Lesson[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter(isRecord)
    .map((raw, index) =>
      migrateLesson(
        {
          id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
          name: typeof raw.name === 'string' ? raw.name : undefined,
          order: typeof raw.order === 'number' ? raw.order : undefined,
          originalLang: typeof raw.originalLang === 'string' ? raw.originalLang : undefined,
          translationLang: typeof raw.translationLang === 'string' ? raw.translationLang : undefined,
        } satisfies LegacyLesson,
        index,
        settings.originalLang,
        settings.translationLang
      )
    )
}

const linkSetsToLessons = (
  rawLessons: Lesson[],
  rawSets: LegacySet[],
  settings: Settings
): { lessons: Lesson[]; sets: CardSet[] } => {
  const lessons =
    rawLessons.length === 0 && rawSets.length > 0
      ? [
          {
            id: uid(),
            name: DEFAULT_LESSON_NAME,
            order: 0,
            originalLang: settings.originalLang,
            translationLang: settings.translationLang,
          },
        ]
      : rawLessons

  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const fallbackLessonId = lessons[0]?.id ?? ''
  const sets = rawSets.map((set) =>
    migrateSet(
      {
        ...set,
        lessonId: set.lessonId && lessonIds.has(set.lessonId) ? set.lessonId : undefined,
      },
      settings.originalLang,
      settings.translationLang,
      fallbackLessonId
    )
  )

  return { lessons, sets }
}

const CATALOG_CODES = new Set(LANGUAGES_CATALOG.map((language) => language.code))

const parseSettings = (value: unknown): Settings => {
  const raw = isRecord(value) ? value : {}

  const originalLang =
    typeof raw.originalLang === 'string' && CATALOG_CODES.has(raw.originalLang)
      ? raw.originalLang
      : DEFAULT_ORIGINAL_LANG
  const translationFallback =
    LANGUAGES_CATALOG.find((language) => language.code !== originalLang)?.code ?? originalLang
  const translationLang =
    typeof raw.translationLang === 'string' &&
    CATALOG_CODES.has(raw.translationLang) &&
    raw.translationLang !== originalLang
      ? raw.translationLang
      : translationFallback

  return {
    theme: raw.theme === 'light' ? 'light' : 'dark',
    originalLang,
    translationLang,
    learnAfterChecks: raw.learnAfterChecks === true,
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
    const settings = parseSettings(undefined)
    const { lessons, sets } = linkSetsToLessons([], parseSets(parsed), settings)

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      lessons,
      sets,
      languages: LANGUAGES_CATALOG,
      settings,
    }
  }

  if (!isRecord(parsed)) throw new Error('invalid backup: root')

  const settings = parseSettings(parsed.settings)
  const rawLessons = parseLessons(parsed.lessons, settings)
  const { lessons, sets } = linkSetsToLessons(rawLessons, parseSets(parsed.sets), settings)

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    lessons,
    sets,
    languages: LANGUAGES_CATALOG,
    settings,
  }
}

export async function createBackup(lessonIds?: string[]): Promise<string> {
  const [allLessons, allSets, settings] = await Promise.all([
    fetchLessons(),
    fetchSets(),
    fetchSettings(),
  ])

  const lessons = lessonIds ? allLessons.filter((lesson) => lessonIds.includes(lesson.id)) : allLessons
  const selectedIds = new Set(lessons.map((lesson) => lesson.id))
  const sets = allSets.filter((set) => selectedIds.has(set.lessonId))

  const data: BackupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
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

export async function applyBackup(data: BackupData, mode: ImportMode): Promise<AppliedBackup> {
  if (mode === 'replace') {
    const lessons = await replaceLessons(data.lessons)
    const sets = await replaceSets(data.sets)
    const settings = await saveSettings(data.settings)

    return { lessons, sets, settings }
  }

  const [existingLessons, existingSets, settings] = await Promise.all([
    fetchLessons(),
    fetchSets(),
    fetchSettings(),
  ])
  const byName = new Map(existingLessons.map((lesson) => [lesson.name, lesson]))
  const existingIds = new Set(existingLessons.map((lesson) => lesson.id))
  const idMap = new Map<string, string>()

  for (const lesson of data.lessons) {
    const duplicate = byName.get(lesson.name)

    if (duplicate) {
      idMap.set(lesson.id, duplicate.id)
    } else if (existingIds.has(lesson.id)) {
      idMap.set(lesson.id, uid())
    } else {
      idMap.set(lesson.id, lesson.id)
    }
  }

  const targetIds = new Set(idMap.values())
  const keptLessons = existingLessons.filter((lesson) => !targetIds.has(lesson.id))
  const keptSets = existingSets.filter((set) => !targetIds.has(set.lessonId))
  const addedLessons = data.lessons.map((lesson, index) => ({
    ...lesson,
    id: idMap.get(lesson.id) as string,
    order: keptLessons.length + index,
  }))
  const addedSets = data.sets.map((set) => ({
    ...set,
    lessonId: idMap.get(set.lessonId) ?? set.lessonId,
  }))
  const lessons = await replaceLessons([...keptLessons, ...addedLessons])
  const sets = await replaceSets([...keptSets, ...addedSets])

  return { lessons, sets, settings }
}
