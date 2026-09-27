export const LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_ORIGINAL_LANG: LanguageCode = 'ru';
export const DEFAULT_TRANSLATION_LANG: LanguageCode = 'en';

export const getLanguageName = (code: LanguageCode): string =>
  LANGUAGES.find((language) => language.code === code)?.name ?? code;
