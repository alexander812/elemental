import {
  DEFAULT_LANGUAGES,
  DEFAULT_ORIGINAL_LANG,
  DEFAULT_TRANSLATION_LANG,
} from '../lib/languages';
import type { Language } from '../lib/languages';
import type { CardSet, CardTexts, Settings } from '../lib/types';
import { uid } from '../lib/uid';
import { fetchLanguages, replaceLanguages } from './languages';
import { fetchSettings, saveSettings } from './settings';
import { fetchSets, migrateCard, replaceSets } from './sets';
import type { LegacyCard } from './sets';

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
  };
};

const parseSets = (value: unknown): CardSet[] => {
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

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : `Набор ${index + 1}`,
      active: raw.active !== false,
      order: typeof raw.order === 'number' ? raw.order : index,
      cards,
    };
  });
};

const parseLanguages = (value: unknown): Language[] => {
  if (!Array.isArray(value)) return DEFAULT_LANGUAGES;

  const seen = new Set<string>();
  const languages = value
    .map((raw) => (isRecord(raw) ? { code: raw.code, name: raw.name } : null))
    .filter(
      (item): item is { code: string; name: string } =>
        item !== null &&
        typeof item.code === 'string' &&
        item.code.length > 0 &&
        typeof item.name === 'string' &&
        item.name.length > 0,
    )
    .filter((item) => {
      if (seen.has(item.code)) return false;

      seen.add(item.code);
      return true;
    })
    .map((item) => ({ code: item.code, name: item.name }));

  return languages.length >= 2 ? languages : DEFAULT_LANGUAGES;
};

const parseSettings = (value: unknown, languages: Language[]): Settings => {
  const raw = isRecord(value) ? value : {};
  const codes = new Set(languages.map((language) => language.code));
  const fallback = languages[0]?.code ?? DEFAULT_ORIGINAL_LANG;

  const originalLang =
    typeof raw.originalLang === 'string' && codes.has(raw.originalLang) ? raw.originalLang : fallback;
  const candidates = languages.filter((language) => language.code !== originalLang);
  const translationFallback = candidates[0]?.code ?? DEFAULT_TRANSLATION_LANG;
  const translationLang =
    typeof raw.translationLang === 'string' &&
    codes.has(raw.translationLang) &&
    raw.translationLang !== originalLang
      ? raw.translationLang
      : translationFallback;

  return {
    theme: raw.theme === 'light' ? 'light' : 'dark',
    originalLang,
    translationLang,
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
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      sets: parseSets(parsed),
      languages: DEFAULT_LANGUAGES,
      settings: parseSettings(undefined, DEFAULT_LANGUAGES),
    };
  }

  if (!isRecord(parsed)) throw new Error('invalid backup: root');

  const languages = parseLanguages(parsed.languages);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sets: parseSets(parsed.sets),
    languages,
    settings: parseSettings(parsed.settings, languages),
  };
}

export async function createBackup(): Promise<string> {
  const [sets, languages, settings] = await Promise.all([
    fetchSets(),
    fetchLanguages(),
    fetchSettings(),
  ]);

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sets,
    languages,
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
  await replaceLanguages(data.languages);
  await saveSettings(data.settings);

  return data;
}
