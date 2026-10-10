import { remapTexts } from '../lib/cards'
import { DEFAULT_COURSE_LANG } from '../lib/languages'
import type { LanguageCode } from '../lib/languages'
import { load, save } from '../lib/storage'
import type { Card, CardSet, CardTexts, Lesson } from '../lib/types'
import { uid } from '../lib/uid'
import { readCourses } from './courses'
import { ensureDefaultLesson, readLessons } from './lessons'
import { readSettings } from './settings'

export type { Card, CardSet, CardTexts } from '../lib/types'

const SETS_KEY = 'sets'
const SEEDED_KEY = 'seeded'

const WELCOME_TEXT: Record<LanguageCode, string> = {
  ru: 'Привет! Я Лекси, я помогу тебе учить иностранный язык качай готовые курсы или создай все что ты хочешь сам.',
  en: "Hi! I'm Lexi, I'll help you learn a foreign language. Download ready-made courses or create everything you want yourself.",
  es: '¡Hola! Soy Lexi, te ayudaré a aprender un idioma extranjero. Descarga cursos ya preparados o crea todo lo que quieras tú mismo.',
  fr: "Salut ! Je suis Lexi, je t'aiderai à apprendre une langue étrangère. Télécharge des cours prêts ou crée tout ce que tu veux toi-même.",
  it: 'Ciao! Sono Lexi e ti aiuterò a imparare una lingua straniera. Scarica corsi pronti o crea tutto quello che vuoi da solo.',
  zh: '你好！我是 Lexi，我会帮你学外语。下载现成课程，或者自己创建你想要的一切。',
  de: 'Hallo! Ich bin Lexi, ich helfe dir, eine Fremdsprache zu lernen. Lade fertige Kurse herunter oder erstelle alles selbst, was du willst.',
}

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

function seedSets(lesson: Lesson): CardSet[] {
  return [
    {
      id: uid(),
      lessonId: lesson.id,
      name: 'Приветствие',
      active: true,
      order: 0,
      swapped: false,
      examPassed: false,
      texts: { ...WELCOME_TEXT },
      cards: [],
    },
  ]
}

function readSets(): CardSet[] {
  const seeded = load<boolean>(SEEDED_KEY, false)

  if (!seeded) {
    const lesson = ensureDefaultLesson()
    const sets = writeSets(seedSets(lesson))

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
    examPassed: false,
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

export async function setSetExamPassed(setId: string, examPassed: boolean): Promise<CardSet[]> {
  const sets = readSets()
  return writeSets(patchSet(sets, setId, (set) => ({ ...set, examPassed })))
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
      examPassed: false,
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
