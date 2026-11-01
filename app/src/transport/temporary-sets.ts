import type { PoliglotVocabularyPage } from '../courses/poliglot/lesson-one'
import type { CardSet } from '../lib/types'
import { readContentSets } from './ready-content'

const sets = new Map<string, CardSet>()
const listeners = new Set<(sets: CardSet[]) => void>()

export const readTemporarySets = (): CardSet[] => structuredClone([...sets.values()])

export function subscribeTemporarySets(listener: (sets: CardSet[]) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  for (const listener of listeners) listener(readTemporarySets())
}

export function isTemporarySet(setId: string): boolean {
  return sets.has(setId)
}

export function writeTemporarySets(updated: CardSet[]): void {
  for (const set of updated) if (sets.has(set.id)) sets.set(set.id, structuredClone(set))
  notify()
}

export function createTemporaryVocabularySet(
  parentSetId: string,
  page: PoliglotVocabularyPage
): string {
  const parent = readContentSets().find((set) => set.id === parentSetId)
  if (!parent) throw new Error('vocabulary_parent_not_found')
  const setId = `${parentSetId}:vocabulary`
  sets.set(setId, {
    id: setId,
    lessonId: parent.lessonId,
    name: page.title,
    active: false,
    order: parent.order,
    swapped: false,
    examPassed: false,
    texts: structuredClone(page.texts),
    cards: page.words.map((word, index) => ({
      id: `${setId}:card:${index}`,
      texts: { ru: word.original, en: word.translation },
      learned: false,
      deleted: false,
      voiceCheck: null,
      writeCheck: null,
    })),
  })
  notify()
  return setId
}

export function removeTemporarySet(setId: string): void {
  if (sets.delete(setId)) notify()
}
