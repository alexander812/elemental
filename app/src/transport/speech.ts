import type { LanguageCode } from '../lib/languages';

const SPEECH_LANG: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  zh: 'zh-CN',
  de: 'de-DE',
};

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, lang: LanguageCode): void {
  const query = text.trim();

  if (!query || !canSpeak()) return;

  const synthesis = window.speechSynthesis;

  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(query);
  utterance.lang = SPEECH_LANG[lang] ?? lang;

  const voice = synthesis
    .getVoices()
    .find((item) => item.lang.toLowerCase().startsWith(lang.toLowerCase()));

  if (voice) utterance.voice = voice;

  synthesis.speak(utterance);
}
