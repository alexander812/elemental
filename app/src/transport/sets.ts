import { remapTexts } from '../lib/cards'
import { DEFAULT_COURSE_LANG } from '../lib/languages'
import type { LanguageCode } from '../lib/languages'
import { load, save } from '../lib/storage'
import type { Card, CardSet, CardTexts, Course, Lesson } from '../lib/types'
import { uid } from '../lib/uid'
import { ensureDefaultCourse, readCourses } from './courses'
import { ensureDefaultLesson, readLessons } from './lessons'
import { readSettings } from './settings'

export type { Card, CardSet, CardTexts } from '../lib/types'

const SETS_KEY = 'sets'
const SEEDED_KEY = 'seeded'

const WEEKDAYS: [string, string][] = [
  ['Понедельник', 'Monday'],
  ['Вторник', 'Tuesday'],
  ['Среда', 'Wednesday'],
  ['Четверг', 'Thursday'],
  ['Пятница', 'Friday'],
  ['Суббота', 'Saturday'],
  ['Воскресенье', 'Sunday'],
]

function normalizeTexts(texts: CardTexts | undefined): CardTexts {
  if (!texts || typeof texts !== 'object') return {}

  return Object.fromEntries(
    Object.entries(texts)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([lang, text]) => [lang, text.trim()])
  ) as CardTexts
}

function createCard(
  userLang: LanguageCode,
  courseLang: LanguageCode,
  original: string,
  translation: string
): Card {
  return {
    id: uid(),
    texts: {
      [userLang]: original.trim(),
      [courseLang]: translation.trim(),
    },
    learned: false,
    deleted: false,
    voiceCheck: null,
    writeCheck: null,
  }
}

function seedSets(lesson: Lesson, course: Course, userLang: LanguageCode): CardSet[] {
  return [
    {
      id: uid(),
      lessonId: lesson.id,
      name: 'Дни недели',
      active: true,
      order: 0,
      swapped: false,
      texts: {},
      cards: WEEKDAYS.map(([original, translation]) =>
        createCard(userLang, course.lang, original, translation)
      ),
    },
  ]
}

function readSets(): CardSet[] {
  const seeded = load<boolean>(SEEDED_KEY, false)
  const settings = readSettings()

  if (!seeded) {
    const lesson = ensureDefaultLesson()
    const course =
      readCourses().find((item) => item.id === lesson.courseId) ?? ensureDefaultCourse()
    const sets = writeSets(seedSets(lesson, course, settings.userLang))

    save(SEEDED_KEY, true)

    return sets
  }

  return load<CardSet[]>(SETS_KEY, [])
}

function writeSets(sets: CardSet[]): CardSet[] {
  save(SETS_KEY, sets)

  return sets
}

function resolveCourseLang(lessonId: string): LanguageCode {
  const lesson = readLessons().find((item) => item.id === lessonId)
  const course = readCourses().find((item) => item.id === lesson?.courseId)

  return course?.lang ?? DEFAULT_COURSE_LANG
}

function patchSet(sets: CardSet[], setId: string, patch: (set: CardSet) => CardSet): CardSet[] {
  return sets.map((set) => (set.id === setId ? patch(set) : set))
}

export async function fetchSets(): Promise<CardSet[]> {
  return readSets()
}

export async function replaceSets(sets: CardSet[]): Promise<CardSet[]> {
  save(SEEDED_KEY, true)
  return writeSets(sets)
}

export type CardPair = {
  original: string
  translation: string
}

export type CardEditPair = CardPair & {
  cardId?: string
}

export async function createSet(payload: {
  lessonId: string
  name: string
  cards: CardPair[]
  texts?: CardTexts
}): Promise<{ setId: string; sets: CardSet[] }> {
  const sets = readSets()
  const maxOrder = sets.reduce((max, set) => Math.max(max, set.order), -1)
  const userLang = readSettings().userLang
  const courseLang = resolveCourseLang(payload.lessonId)
  const newSet: CardSet = {
    id: uid(),
    lessonId: payload.lessonId,
    name: payload.name.trim(),
    active: true,
    order: maxOrder + 1,
    swapped: false,
    texts: normalizeTexts(payload.texts),
    cards: payload.cards.map((card) => createCard(userLang, courseLang, card.original, card.translation)),
  }

  return { setId: newSet.id, sets: writeSets([...sets, newSet]) }
}

export async function updateSet(payload: {
  setId: string
  lessonId: string
  name: string
  pairs: CardEditPair[]
  texts?: CardTexts
}): Promise<CardSet[]> {
  const sets = readSets()
  const userLang = readSettings().userLang
  const courseLang = resolveCourseLang(payload.lessonId)
  const pairByCardId = new Map(
    payload.pairs
      .filter((pair) => pair.cardId !== undefined)
      .map((pair) => [pair.cardId as string, pair])
  )
  const newCards = payload.pairs
    .filter((pair) => pair.cardId === undefined)
    .map((pair) => createCard(userLang, courseLang, pair.original, pair.translation))

  return writeSets(
    patchSet(sets, payload.setId, (set) => {
      const courseLangChanged = resolveCourseLang(set.lessonId) !== courseLang

      const cards = set.cards.map((card) => {
        const pair = pairByCardId.get(card.id)

        if (pair) {
          return {
            ...card,
            texts: {
              [userLang]: pair.original.trim(),
              [courseLang]: pair.translation.trim(),
            },
          }
        }

        if (!courseLangChanged) return card

        return {
          ...card,
          texts: remapTexts(card.texts, userLang, courseLang),
        }
      })

      return {
        ...set,
        lessonId: payload.lessonId,
        name: payload.name.trim(),
        texts: payload.texts
          ? normalizeTexts(payload.texts)
          : courseLangChanged
            ? remapTexts(set.texts, userLang, courseLang)
            : set.texts,
        cards: [...cards, ...newCards],
      }
    })
  )
}

export async function updateSetText(
  setId: string,
  lang: LanguageCode,
  text: string
): Promise<CardSet[]> {
  const sets = readSets()

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      texts: { ...set.texts, [lang]: text.trim() },
    }))
  )
}

export async function setSetActive(setId: string, active: boolean): Promise<CardSet[]> {
  const sets = readSets()
  return writeSets(patchSet(sets, setId, (set) => ({ ...set, active })))
}

export async function setSetSwapped(setId: string, swapped: boolean): Promise<CardSet[]> {
  const sets = readSets()
  return writeSets(patchSet(sets, setId, (set) => ({ ...set, swapped })))
}

export async function deleteSet(setId: string): Promise<CardSet[]> {
  const sets = readSets()
  return writeSets(sets.filter((set) => set.id !== setId))
}

export async function deleteSetsByLesson(lessonId: string): Promise<CardSet[]> {
  const sets = readSets()
  return writeSets(sets.filter((set) => set.lessonId !== lessonId))
}

export async function deleteSetsByLessonIds(lessonIds: string[]): Promise<CardSet[]> {
  const sets = readSets()
  const ids = new Set(lessonIds)
  return writeSets(sets.filter((set) => !ids.has(set.lessonId)))
}

export async function reorderSets(ids: string[]): Promise<CardSet[]> {
  const sets = readSets()
  const orderMap = new Map(ids.map((id, index) => [id, index]))

  return writeSets(
    sets.map((set) => {
      const order = orderMap.get(set.id)
      return order === undefined ? set : { ...set, order }
    })
  )
}

export async function addCards(setId: string, texts: CardTexts[]): Promise<CardSet[]> {
  const sets = readSets()
  const cards: Card[] = texts.map((item) => ({
    id: uid(),
    texts: Object.fromEntries(
      Object.entries(item).map(([lang, text]) => [lang, text?.trim() ?? ''])
    ) as CardTexts,
    learned: false,
    deleted: false,
    voiceCheck: null,
    writeCheck: null,
  }))

  return writeSets(patchSet(sets, setId, (set) => ({ ...set, cards: [...set.cards, ...cards] })))
}

export async function addCard(setId: string, texts: CardTexts): Promise<CardSet[]> {
  return addCards(setId, [texts])
}

export async function updateCard(
  setId: string,
  cardId: string,
  texts: CardTexts
): Promise<CardSet[]> {
  const sets = readSets()

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              texts: Object.fromEntries(
                Object.entries(texts).map(([lang, text]) => [lang, text?.trim() ?? ''])
              ) as CardTexts,
            }
          : card
      ),
    }))
  )
}

export async function updateCardChecks(
  setId: string,
  cardId: string,
  checks: { voiceCheck?: boolean | null; writeCheck?: boolean | null }
): Promise<CardSet[]> {
  const sets = readSets()

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              voiceCheck: checks.voiceCheck === undefined ? card.voiceCheck : checks.voiceCheck,
              writeCheck: checks.writeCheck === undefined ? card.writeCheck : checks.writeCheck,
            }
          : card
      ),
    }))
  )
}

export async function setCardLearned(
  setId: string,
  cardId: string,
  learned: boolean
): Promise<CardSet[]> {
  const sets = readSets()

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) => (card.id === cardId ? { ...card, learned } : card)),
    }))
  )
}

export async function deleteCard(setId: string, cardId: string): Promise<CardSet[]> {
  const sets = readSets()

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) => (card.id === cardId ? { ...card, deleted: true } : card)),
    }))
  )
}

export async function deleteCards(setId: string, learned: boolean): Promise<CardSet[]> {
  const sets = readSets()

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) =>
        !card.deleted && card.learned === learned ? { ...card, deleted: true } : card
      ),
    }))
  )
}

export async function resetSet(setId: string): Promise<CardSet[]> {
  const sets = readSets()

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) => ({
        ...card,
        learned: false,
        deleted: false,
        voiceCheck: null,
        writeCheck: null,
      })),
    })),
  )
}

export async function restoreCards(setId: string, cardIds: string[]): Promise<CardSet[]> {
  const sets = readSets()
  const ids = new Set(cardIds)

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) =>
        ids.has(card.id) ? { ...card, deleted: false, learned: false } : card
      ),
    }))
  )
}
