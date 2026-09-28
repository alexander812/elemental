import { DEFAULT_ORIGINAL_LANG, DEFAULT_TRANSLATION_LANG } from '../lib/languages';
import type { LanguageCode } from '../lib/languages';
import { load, save } from '../lib/storage';
import type { Card, CardSet, CardTexts } from '../lib/types';
import { uid } from '../lib/uid';

export type { Card, CardSet, CardTexts } from '../lib/types';

const SETS_KEY = 'sets';
const SEEDED_KEY = 'seeded';

const WEEKDAYS: [string, string][] = [
  ['Понедельник', 'Monday'],
  ['Вторник', 'Tuesday'],
  ['Среда', 'Wednesday'],
  ['Четверг', 'Thursday'],
  ['Пятница', 'Friday'],
  ['Суббота', 'Saturday'],
  ['Воскресенье', 'Sunday'],
];

function createCard(original: string, translation: string): Card {
  return {
    id: uid(),
    texts: {
      [DEFAULT_ORIGINAL_LANG]: original,
      [DEFAULT_TRANSLATION_LANG]: translation,
    },
    learned: false,
    deleted: false,
  };
}

function seedSets(): CardSet[] {
  return [
    {
      id: uid(),
      name: 'Дни недели',
      active: true,
      order: 0,
      cards: WEEKDAYS.map(([original, translation]) => createCard(original, translation)),
    },
  ];
}

export type LegacyCard = {
  deleted?: boolean;
  id: string;
  learned: boolean;
  original?: string;
  originalLang?: LanguageCode;
  texts?: CardTexts;
  translation?: string;
  translationLang?: LanguageCode;
};

export function migrateCard(card: LegacyCard): Card {
  if (card.texts) {
    return {
      id: card.id,
      texts: card.texts,
      learned: card.learned,
      deleted: card.deleted ?? false,
    };
  }

  const legacy = !card.originalLang || !card.translationLang;
  const original = (legacy ? card.translation : card.original) ?? '';
  const translation = (legacy ? card.original : card.translation) ?? '';
  const originalLang = card.originalLang ?? DEFAULT_ORIGINAL_LANG;
  const translationLang = card.translationLang ?? DEFAULT_TRANSLATION_LANG;

  return {
    id: card.id,
    texts: { [originalLang]: original, [translationLang]: translation },
    learned: card.learned,
    deleted: card.deleted ?? false,
  };
}

function readSets(): CardSet[] {
  const seeded = load<boolean>(SEEDED_KEY, false);
  const sets = seeded ? load<CardSet[]>(SETS_KEY, []) : seedSets();

  if (!seeded) {
    save(SETS_KEY, sets);
    save(SEEDED_KEY, true);
  }

  return sets.map((set) => ({ ...set, cards: set.cards.map(migrateCard) }));
}

function writeSets(sets: CardSet[]): CardSet[] {
  save(SETS_KEY, sets);
  return sets;
}

function patchSet(sets: CardSet[], setId: string, patch: (set: CardSet) => CardSet): CardSet[] {
  return sets.map((set) => (set.id === setId ? patch(set) : set));
}

export async function fetchSets(): Promise<CardSet[]> {
  return readSets();
}

export async function replaceSets(sets: CardSet[]): Promise<CardSet[]> {
  save(SEEDED_KEY, true);
  return writeSets(sets);
}

export async function createSet(name: string): Promise<CardSet[]> {
  const sets = readSets();
  const maxOrder = sets.reduce((max, set) => Math.max(max, set.order), 0);
  const newSet: CardSet = {
    id: uid(),
    name: name.trim(),
    active: true,
    order: maxOrder + 1,
    cards: [],
  };

  return writeSets([...sets, newSet]);
}

export async function setSetActive(setId: string, active: boolean): Promise<CardSet[]> {
  const sets = readSets();
  return writeSets(patchSet(sets, setId, (set) => ({ ...set, active })));
}

export async function deleteSet(setId: string): Promise<CardSet[]> {
  const sets = readSets();
  return writeSets(sets.filter((set) => set.id !== setId));
}

export async function removeCardsWithLanguage(code: LanguageCode): Promise<CardSet[]> {
  const sets = readSets();

  return writeSets(
    sets.map((set) => ({
      ...set,
      cards: set.cards.filter((card) => card.texts[code] === undefined),
    })),
  );
}

export async function reorderSets(ids: string[]): Promise<CardSet[]> {
  const sets = readSets();
  const orderMap = new Map(ids.map((id, index) => [id, index]));

  return writeSets(
    sets.map((set) => {
      const order = orderMap.get(set.id);
      return order === undefined ? set : { ...set, order };
    }),
  );
}

export async function addCards(setId: string, texts: CardTexts[]): Promise<CardSet[]> {
  const sets = readSets();
  const cards: Card[] = texts.map((item) => ({
    id: uid(),
    texts: Object.fromEntries(
      Object.entries(item).map(([lang, text]) => [lang, text?.trim() ?? '']),
    ) as CardTexts,
    learned: false,
    deleted: false,
  }));

  return writeSets(patchSet(sets, setId, (set) => ({ ...set, cards: [...set.cards, ...cards] })));
}

export async function addCard(setId: string, texts: CardTexts): Promise<CardSet[]> {
  return addCards(setId, [texts]);
}

export async function setCardLearned(
  setId: string,
  cardId: string,
  learned: boolean,
): Promise<CardSet[]> {
  const sets = readSets();

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) => (card.id === cardId ? { ...card, learned } : card)),
    })),
  );
}

export async function deleteCard(setId: string, cardId: string): Promise<CardSet[]> {
  const sets = readSets();

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) => (card.id === cardId ? { ...card, deleted: true } : card)),
    })),
  );
}

export async function deleteCards(setId: string, learned: boolean): Promise<CardSet[]> {
  const sets = readSets();

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) =>
        !card.deleted && card.learned === learned ? { ...card, deleted: true } : card,
      ),
    })),
  );
}

export async function restoreCards(setId: string, cardIds: string[]): Promise<CardSet[]> {
  const sets = readSets();
  const ids = new Set(cardIds);

  return writeSets(
    patchSet(sets, setId, (set) => ({
      ...set,
      cards: set.cards.map((card) =>
        ids.has(card.id) ? { ...card, deleted: false, learned: false } : card,
      ),
    })),
  );
}
