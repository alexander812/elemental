import { remapTexts } from '../lib/cards'
import {
  DEFAULT_ORIGINAL_LANG,
  DEFAULT_TRANSLATION_LANG,
  LANGUAGES_CATALOG,
} from '../lib/languages'
import type { LanguageCode } from '../lib/languages'
import { load, save } from '../lib/storage'
import type { Card, CardSet, CardTexts } from '../lib/types'
import { uid } from '../lib/uid'
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

function createCard(
  originalLang: LanguageCode,
  translationLang: LanguageCode,
  original: string,
  translation: string
): Card {
  return {
    id: uid(),
    texts: {
      [originalLang]: original.trim(),
      [translationLang]: translation.trim(),
    },
    learned: false,
    deleted: false,
    voiceCheck: null,
    writeCheck: null,
  }
}

function seedSets(): CardSet[] {
  return [
    {
      id: uid(),
      name: 'Дни недели',
      active: true,
      order: 0,
      originalLang: DEFAULT_ORIGINAL_LANG,
      translationLang: DEFAULT_TRANSLATION_LANG,
      cards: WEEKDAYS.map(([original, translation]) =>
        createCard(DEFAULT_ORIGINAL_LANG, DEFAULT_TRANSLATION_LANG, original, translation)
      ),
    },
  ]
}

export type LegacyCard = {
  deleted?: boolean
  id: string
  learned: boolean
  original?: string
  originalLang?: LanguageCode
  texts?: CardTexts
  translation?: string
  translationLang?: LanguageCode
  voiceCheck?: boolean | null
  writeCheck?: boolean | null
}

const parseCheck = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null)

export function migrateCard(card: LegacyCard): Card {
  if (card.texts) {
    return {
      id: card.id,
      texts: card.texts,
      learned: card.learned,
      deleted: card.deleted ?? false,
      voiceCheck: parseCheck(card.voiceCheck),
      writeCheck: parseCheck(card.writeCheck),
    }
  }

  const legacy = !card.originalLang || !card.translationLang
  const original = (legacy ? card.translation : card.original) ?? ''
  const translation = (legacy ? card.original : card.translation) ?? ''
  const originalLang = card.originalLang ?? DEFAULT_ORIGINAL_LANG
  const translationLang = card.translationLang ?? DEFAULT_TRANSLATION_LANG

  return {
    id: card.id,
    texts: { [originalLang]: original, [translationLang]: translation },
    learned: card.learned,
    deleted: card.deleted ?? false,
    voiceCheck: parseCheck(card.voiceCheck),
    writeCheck: parseCheck(card.writeCheck),
  }
}

export type LegacySet = Omit<CardSet, 'originalLang' | 'translationLang'> & {
  originalLang?: LanguageCode
  translationLang?: LanguageCode
}

export function migrateSet(
  set: LegacySet,
  fallbackOriginal: LanguageCode = DEFAULT_ORIGINAL_LANG,
  fallbackTranslation: LanguageCode = DEFAULT_TRANSLATION_LANG
): CardSet {
  const originalLang = set.originalLang ?? fallbackOriginal
  const safeFallback =
    fallbackTranslation === originalLang
      ? (LANGUAGES_CATALOG.find((language) => language.code !== originalLang)?.code ??
        DEFAULT_TRANSLATION_LANG)
      : fallbackTranslation
  const translationLang =
    set.translationLang && set.translationLang !== originalLang ? set.translationLang : safeFallback

  return { ...set, originalLang, translationLang, cards: set.cards.map(migrateCard) }
}

function readSets(): CardSet[] {
  const seeded = load<boolean>(SEEDED_KEY, false)
  const sets = seeded ? load<LegacySet[]>(SETS_KEY, []) : seedSets()

  if (!seeded) {
    save(SETS_KEY, sets)
    save(SEEDED_KEY, true)
  }

  const settings = readSettings()

  return sets.map((set) => migrateSet(set, settings.originalLang, settings.translationLang))
}

function writeSets(sets: CardSet[]): CardSet[] {
  save(SETS_KEY, sets)
  return sets
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
  name: string
  originalLang: LanguageCode
  translationLang: LanguageCode
  cards: CardPair[]
}): Promise<{ setId: string; sets: CardSet[] }> {
  const sets = readSets()
  const maxOrder = sets.reduce((max, set) => Math.max(max, set.order), 0)
  const newSet: CardSet = {
    id: uid(),
    name: payload.name.trim(),
    active: true,
    order: maxOrder + 1,
    originalLang: payload.originalLang,
    translationLang: payload.translationLang,
    cards: payload.cards.map((card) =>
      createCard(payload.originalLang, payload.translationLang, card.original, card.translation)
    ),
  }

  return { setId: newSet.id, sets: writeSets([...sets, newSet]) }
}

export async function updateSet(payload: {
  setId: string
  name: string
  originalLang: LanguageCode
  translationLang: LanguageCode
  pairs: CardEditPair[]
}): Promise<CardSet[]> {
  const sets = readSets()
  const pairByCardId = new Map(
    payload.pairs
      .filter((pair) => pair.cardId !== undefined)
      .map((pair) => [pair.cardId as string, pair])
  )
  const newCards = payload.pairs
    .filter((pair) => pair.cardId === undefined)
    .map((pair) =>
      createCard(payload.originalLang, payload.translationLang, pair.original, pair.translation)
    )

  return writeSets(
    patchSet(sets, payload.setId, (set) => {
      const languagesChanged =
        set.originalLang !== payload.originalLang || set.translationLang !== payload.translationLang

      const cards = set.cards.map((card) => {
        const pair = pairByCardId.get(card.id)

        if (pair) {
          return {
            ...card,
            texts: {
              [payload.originalLang]: pair.original.trim(),
              [payload.translationLang]: pair.translation.trim(),
            },
          }
        }

        if (!languagesChanged) return card

        return {
          ...card,
          texts: remapTexts(card.texts, payload.originalLang, payload.translationLang),
        }
      })

      return {
        ...set,
        name: payload.name.trim(),
        originalLang: payload.originalLang,
        translationLang: payload.translationLang,
        cards: [...cards, ...newCards],
      }
    })
  )
}

export async function setSetActive(setId: string, active: boolean): Promise<CardSet[]> {
  const sets = readSets()
  return writeSets(patchSet(sets, setId, (set) => ({ ...set, active })))
}

export async function deleteSet(setId: string): Promise<CardSet[]> {
  const sets = readSets()
  return writeSets(sets.filter((set) => set.id !== setId))
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
