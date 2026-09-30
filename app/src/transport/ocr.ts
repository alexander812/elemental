import type { LanguageCode } from '../lib/languages';
import { callNative } from '../lib/nativeBridge';

export type ScanTextResult = {
  text: string;
  confidence: number;
  cancelled: boolean;
};

export function scanText(lang: LanguageCode): Promise<ScanTextResult> {
  return callNative<ScanTextResult>('scanText', { lang });
}
