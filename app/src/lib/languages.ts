export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES_CATALOG: Language[] = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'zh', name: '中文' },
  { code: 'de', name: 'Deutsch' },
];

export type LanguageCode = string;

export const DEFAULT_ORIGINAL_LANG: LanguageCode = 'ru';
export const DEFAULT_TRANSLATION_LANG: LanguageCode = 'en';

export const DEFAULT_LANGUAGES: Language[] = [
  { code: DEFAULT_ORIGINAL_LANG, name: 'Русский' },
  { code: DEFAULT_TRANSLATION_LANG, name: 'English' },
];

export const getLanguageName = (code: LanguageCode, languages: Language[]): string =>
  languages.find((language) => language.code === code)?.name ?? code;

export const getCatalogLanguage = (code: LanguageCode): Language | undefined =>
  LANGUAGES_CATALOG.find((language) => language.code === code);
