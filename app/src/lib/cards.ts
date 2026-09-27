import { LANGUAGES } from './languages';
import type { LanguageCode } from './languages';
import type { Card } from './types';

export function getCardText(card: Card, preferred: LanguageCode): { lang: LanguageCode; text: string } {
  const text = card.texts[preferred];

  if (text !== undefined) {
    return { lang: preferred, text };
  }

  const fallback = LANGUAGES.find((language) => card.texts[language.code] !== undefined);

  if (fallback) {
    return { lang: fallback.code, text: card.texts[fallback.code] as string };
  }

  return { lang: preferred, text: '' };
}
