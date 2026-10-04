import { callNative, isNativeBridgeAvailable } from '../lib/nativeBridge';

const SHORT_VIBRATION_MS = 20;

function vibrate(durationMs: number): void {
  if (!isNativeBridgeAvailable()) return;

  callNative('vibrate', { durationMs }).catch(() => {});
}

export function vibrateShort(): void {
  vibrate(SHORT_VIBRATION_MS);
}

export function vibrateLong(): void {
  vibrate(SHORT_VIBRATION_MS * 2);
}

export function vibrateSuccess(): void {
  vibrate(SHORT_VIBRATION_MS);
}

export function vibrateError(): void {
  vibrate(SHORT_VIBRATION_MS * 3);
}
