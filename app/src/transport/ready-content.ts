import { getCourseLessonCounts, getLessonTaskCounts } from '../lib/progress'
import { normalizePhrase } from '../lib/phraseAnswer'
import { load, save } from '../lib/storage'
import type { Card, CardSet, Course, Lesson } from '../lib/types'

type Content = { lessons: Lesson[]; sets: CardSet[] }
type NormalSet = Omit<CardSet, 'cards'> & { cards: Record<string, Card>; cardOrder: string[] }
type Graph = { lessons: Record<string, Lesson>; sets: Record<string, NormalSet> }
export type ContentPatch = { path: (string | number)[]; value?: unknown; remove?: boolean }
export type ReadyCourseState = {
  patches: ContentPatch[]
  summary: { total: number; completed: number }
  phraseProgress?: Record<string, { solved: string[]; page: string; index: number }>
}

const cache = new Map<string, { baseline: Graph; content: Content }>()
const pending = new Map<string, Promise<void>>()
let generation = 0

export const readReadyStates = (): Record<string, ReadyCourseState> => load('ready-state', {})
export function writeReadyStates(states: Record<string, ReadyCourseState>): void {
  save('ready-state', states)
}

const normalize = (content: Content): Graph => ({
  lessons: Object.fromEntries(content.lessons.map((lesson) => [lesson.id, lesson])),
  sets: Object.fromEntries(
    content.sets.map((set) => [
      set.id,
      {
        ...set,
        cards: Object.fromEntries(set.cards.map((card) => [card.id, card])),
        cardOrder: set.cards.map((card) => card.id),
      },
    ])
  ),
})

const expand = (graph: Graph): Content => ({
  lessons: Object.values(graph.lessons),
  sets: Object.values(graph.sets).map(({ cardOrder, cards, ...set }) => ({
    ...set,
    cards: cardOrder.filter((id) => cards[id]).map((id) => cards[id]),
  })),
})

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

function diff(before: unknown, after: unknown, path: (string | number)[] = []): ContentPatch[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return []
  if (!isObject(before) || !isObject(after)) return [{ path, value: after }]
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) => {
    if (!(key in after)) return [{ path: [...path, key], remove: true }]
    if (!(key in before)) return [{ path: [...path, key], value: after[key] }]
    return diff(before[key], after[key], [...path, key])
  })
}

function applyPatches(baseline: Graph, patches: ContentPatch[]): Graph {
  const result = structuredClone(baseline)
  for (const patch of patches) {
    if (
      !Array.isArray(patch.path) ||
      patch.path.length === 0 ||
      patch.path.some((key) => ['__proto__', 'constructor', 'prototype'].includes(String(key)))
    )
      throw new Error('invalid_ready_state')
    let target = result as unknown as Record<string, unknown>
    for (const part of patch.path.slice(0, -1)) {
      if (!isObject(target[part])) target[part] = {}
      target = target[part] as Record<string, unknown>
    }
    const key = patch.path[patch.path.length - 1]
    if (patch.remove) delete target[key]
    else target[key] = structuredClone(patch.value)
  }
  return result
}

function hash(text: string): string {
  let value = 2166136261
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return (value >>> 0).toString(36)
}

const pageKey = (page: NonNullable<CardSet['phraseTask']>['pages'][number]): string =>
  hash(
    page.kind === 'question'
      ? JSON.stringify([page.prompt, normalizePhrase(page.answer.join(' '))])
      : page.title
  )

function phraseProgress(sets: CardSet[]): NonNullable<ReadyCourseState['phraseProgress']> {
  return Object.fromEntries(
    sets.flatMap((set) => {
      const task = set.phraseTask
      if (!task) return []
      return [
        [
          set.id,
          {
            solved: task.solved.flatMap((index) =>
              task.pages[index] ? [pageKey(task.pages[index])] : []
            ),
            page: task.pages[task.pageIndex] ? pageKey(task.pages[task.pageIndex]) : '',
            index: task.pageIndex,
          },
        ],
      ]
    })
  )
}

function summarize(content: Content, courseId: string): ReadyCourseState['summary'] {
  const counts = getCourseLessonCounts(content.lessons, getLessonTaskCounts(content.sets)).get(
    courseId
  )
  return { total: counts?.total ?? 0, completed: counts?.passed ?? 0 }
}

export function clearReadyContentCache(): void {
  generation += 1
  cache.clear()
  pending.clear()
}

export function resolveReadyCourseId(contentId: string): string | undefined {
  for (const [courseId, state] of Object.entries(readReadyStates())) {
    if (state.patches.some((patch) => !patch.remove && patch.path[1] === contentId)) return courseId
  }
  return load<Course[]>('courses', []).find(
    (course) => course.source && contentId.startsWith(`${course.id}:`)
  )?.id
}

export async function ensureReadyCourse(courseId: string): Promise<void> {
  const course = load<Course[]>('courses', []).find((item) => item.id === courseId)
  if (!course?.source || cache.has(courseId)) return
  const running = pending.get(courseId)
  if (running) return running
  const started = generation
  const request = (async () => {
    const { buildReadyContent } = await import('./ready-builders')
    const built = await buildReadyContent(course)
    if (
      started !== generation ||
      !load<Course[]>('courses', []).some((item) => item.id === courseId)
    )
      return
    const baseline = structuredClone(normalize(built))
    const state = readReadyStates()[courseId]
    const content = expand(
      state ? applyPatches(baseline, state.patches) : structuredClone(baseline)
    )
    for (const set of content.sets) {
      const progress = state?.phraseProgress?.[set.id]
      const task = set.phraseTask
      if (!progress || !task) continue
      task.solved = task.pages.flatMap((page, index) =>
        page.kind === 'question' && progress.solved.includes(pageKey(page)) ? [index] : []
      )
      const restored = task.pages.findIndex((page) => pageKey(page) === progress.page)
      task.pageIndex =
        restored >= 0 ? restored : Math.max(0, Math.min(progress.index, task.pages.length - 1))
      const questions = task.pages.filter((page) => page.kind === 'question').length
      set.examPassed = questions > 0 && task.solved.length === questions
    }
    cache.set(courseId, { baseline, content })
    const states = readReadyStates()
    states[courseId] = {
      patches: diff(baseline, normalize(content)),
      summary: summarize(content, courseId),
      phraseProgress: phraseProgress(content.sets),
    }
    writeReadyStates(states)
  })()
  pending.set(courseId, request)
  try {
    await request
  } finally {
    if (pending.get(courseId) === request) pending.delete(courseId)
  }
}

export function readContentLessons(): Lesson[] {
  return structuredClone([
    ...load<Lesson[]>('lessons', []),
    ...[...cache.values()].flatMap((entry) => entry.content.lessons),
  ])
}
export function readContentSets(): CardSet[] {
  return structuredClone([
    ...load<CardSet[]>('sets', []),
    ...[...cache.values()].flatMap((entry) => entry.content.sets),
  ])
}

function writeContent(content: Content): void {
  const courses = load<Course[]>('courses', [])
  const sourceIds = new Set(courses.filter((course) => course.source).map((course) => course.id))
  const lessonOwners = new Map(content.lessons.map((lesson) => [lesson.id, lesson.courseId]))
  // Preserve provenance for sets while a lesson is being removed; cascade deletion follows.
  for (const [courseId, entry] of cache) {
    for (const lesson of Object.values(entry.baseline.lessons))
      if (!lessonOwners.has(lesson.id)) lessonOwners.set(lesson.id, courseId)
  }
  const states = readReadyStates()
  for (const [courseId, entry] of cache) {
    const lessons = content.lessons.filter(
      (lesson) => lesson.courseId === courseId && sourceIds.has(courseId)
    )
    const sets = content.sets.filter(
      (set) => lessonOwners.get(set.lessonId) === courseId && sourceIds.has(courseId)
    )
    entry.content = structuredClone({ lessons, sets })
    if (sourceIds.has(courseId))
      states[courseId] = {
        patches: diff(entry.baseline, normalize(entry.content)),
        summary: summarize(entry.content, courseId),
        phraseProgress: phraseProgress(sets),
      }
  }
  for (const courseId of Object.keys(states)) if (!sourceIds.has(courseId)) delete states[courseId]
  save(
    'lessons',
    content.lessons.filter((lesson) => !sourceIds.has(lesson.courseId))
  )
  save(
    'sets',
    content.sets.filter((set) => !sourceIds.has(lessonOwners.get(set.lessonId) ?? ''))
  )
  writeReadyStates(states)
}

export function writeContentLessons(lessons: Lesson[]): Lesson[] {
  writeContent({ lessons, sets: readContentSets() })
  return readContentLessons()
}
export function writeContentSets(sets: CardSet[]): CardSet[] {
  writeContent({ lessons: readContentLessons(), sets })
  return readContentSets()
}

export function remapReadyState(
  state: ReadyCourseState,
  from: string,
  to: string
): ReadyCourseState {
  const replace = (value: unknown): unknown => {
    if (typeof value === 'string')
      return value === from
        ? to
        : value.startsWith(`${from}:`)
          ? `${to}${value.slice(from.length)}`
          : value
    if (Array.isArray(value)) return value.map(replace)
    if (isObject(value))
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [String(replace(key)), replace(item)])
      )
    return value
  }
  return replace(structuredClone(state)) as ReadyCourseState
}
