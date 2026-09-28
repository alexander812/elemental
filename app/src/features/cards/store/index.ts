import { createEffect } from 'effector';

import type { LanguageCode } from '../../../lib/languages';
import { speak } from '../../../transport/speech';

export const speakFx = createEffect((payload: { text: string; lang: LanguageCode }) => {
  speak(payload.text, payload.lang);
});
