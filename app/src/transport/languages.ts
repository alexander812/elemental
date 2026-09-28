import { DEFAULT_LANGUAGES, getCatalogLanguage } from '../lib/languages';
import type { Language } from '../lib/languages';
import { load, save } from '../lib/storage';

const LANGUAGES_KEY = 'languages';

function readLanguages(): Language[] {
  const stored = load<Language[] | null>(LANGUAGES_KEY, null);

  if (stored === null || stored.length === 0) {
    save(LANGUAGES_KEY, DEFAULT_LANGUAGES);
    return DEFAULT_LANGUAGES;
  }

  return stored;
}

export async function fetchLanguages(): Promise<Language[]> {
  return readLanguages();
}

export async function replaceLanguages(languages: Language[]): Promise<Language[]> {
  const next = languages.length > 0 ? languages : DEFAULT_LANGUAGES;
  save(LANGUAGES_KEY, next);

  return next;
}

export async function addLanguage(code: string): Promise<Language[]> {
  const languages = readLanguages();

  if (languages.some((language) => language.code === code)) {
    return languages;
  }

  const language = getCatalogLanguage(code);

  if (!language) {
    throw new Error(`Unknown language: ${code}`);
  }

  const next = [...languages, language];
  save(LANGUAGES_KEY, next);

  return next;
}

export async function removeLanguage(code: string): Promise<Language[]> {
  const languages = readLanguages();
  const next = languages.filter((language) => language.code !== code);
  save(LANGUAGES_KEY, next);

  return next;
}
