import {
  DEFAULT_ORIGINAL_LANG,
  LANGUAGES_CATALOG,
} from '../lib/languages';
import type { Language } from '../lib/languages';
import type { CardSet, CardTexts, Settings } from '../lib/types';
import { uid } from '../lib/uid';
import { fetchSettings, saveSettings } from './settings';
import { fetchSets, migrateCard, migrateSet, replaceSets } from './sets';
import type { LegacyCard, LegacySet } from './sets';

export type BackupData = {
  version: number;
  exportedAt: string;
  sets: CardSet[];
  languages: Language[];
  settings: Settings;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseTexts = (value: unknown): CardTexts | undefined => {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const parseLegacyCard = (value: unknown): LegacyCard | null => {
  if (!isRecord(value)) return null;

  const texts = parseTexts(value.texts);

  if (!texts && typeof value.original !== 'string' && typeof value.translation !== 'string') {
    return null;
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
  };
};

const parseSets = (value: unknown, settings: Settings): CardSet[] => {
  if (!Array.isArray(value)) throw new Error('invalid backup: sets');

  return value.map((raw, index) => {
    if (!isRecord(raw)) throw new Error('invalid backup: set');

    const cards = Array.isArray(raw.cards)
      ? raw.cards
          .map(parseLegacyCard)
          .filter((card): card is LegacyCard => card !== null)
          .map(migrateCard)
          .filter((card) => Object.values(card.texts).some((text) => (text ?? '').trim().length > 0))
      : [];

    const set: LegacySet = {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : `Набор ${index + 1}`,
      active: raw.active !== false,
      order: typeof raw.order === 'number' ? raw.order : index,
      originalLang: typeof raw.originalLang === 'string' ? raw.originalLang : undefined,
      translationLang: typeof raw.translationLang === 'string' ? raw.translationLang : undefined,
      cards,
    };

    return migrateSet(set, settings.originalLang, settings.translationLang);
  });
};

const CATALOG_CODES = new Set(LANGUAGES_CATALOG.map((language) => language.code));

const parseSettings = (value: unknown): Settings => {
  const raw = isRecord(value) ? value : {};

  const originalLang =
    typeof raw.originalLang === 'string' && CATALOG_CODES.has(raw.originalLang)
      ? raw.originalLang
      : DEFAULT_ORIGINAL_LANG;
  const translationFallback =
    LANGUAGES_CATALOG.find((language) => language.code !== originalLang)?.code ??
    originalLang;
  const translationLang =
    typeof raw.translationLang === 'string' &&
    CATALOG_CODES.has(raw.translationLang) &&
    raw.translationLang !== originalLang
      ? raw.translationLang
      : translationFallback;

  return {
    theme: raw.theme === 'light' ? 'light' : 'dark',
    originalLang,
    translationLang,
    learnAfterChecks: raw.learnAfterChecks === true,
  };
};

export function parseBackup(raw: string): BackupData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('invalid backup: not json');
  }

  if (Array.isArray(parsed)) {
    const settings = parseSettings(undefined);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      sets: parseSets(parsed, settings),
      languages: LANGUAGES_CATALOG,
      settings,
    };
  }

  if (!isRecord(parsed)) throw new Error('invalid backup: root');

  const settings = parseSettings(parsed.settings);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sets: parseSets(parsed.sets, settings),
    languages: LANGUAGES_CATALOG,
    settings,
  };
}

export async function createBackup(): Promise<string> {
  const [sets, settings] = await Promise.all([fetchSets(), fetchSettings()]);

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sets,
    languages: LANGUAGES_CATALOG,
    settings,
  };

  return JSON.stringify(data, null, 2);
}

export function downloadBackup(content: string): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');

  link.download = `lexi-backup-${stamp}.json`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function applyBackup(data: BackupData): Promise<BackupData> {
  await replaceSets(data.sets);
  await saveSettings(data.settings);

  return data;
}
