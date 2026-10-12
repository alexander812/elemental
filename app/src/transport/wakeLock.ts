import { callNative, isNativeBridgeAvailable } from '../lib/nativeBridge'

let keepAwake = false
let sentinel: WakeLockSentinel | null = null
let listenerInstalled = false

const getWakeLock = (): WakeLock | undefined => {
  if (typeof navigator === 'undefined') return undefined
  if (!('wakeLock' in navigator)) return undefined

  return navigator.wakeLock
}

const requestWebWakeLock = async (): Promise<void> => {
  const wakeLock = getWakeLock()

  if (!wakeLock || document.visibilityState !== 'visible') return
  if (sentinel && !sentinel.released) return

  try {
    sentinel = await wakeLock.request('screen')
  } catch {
    sentinel = null
  }
}

const releaseWebWakeLock = async (): Promise<void> => {
  const current = sentinel

  sentinel = null

  if (!current) return

  try {
    await current.release()
  } catch {
    // already released
  }
}

const ensureVisibilityListener = (): void => {
  if (listenerInstalled) return

  listenerInstalled = true

  document.addEventListener('visibilitychange', () => {
    if (keepAwake && document.visibilityState === 'visible') void requestWebWakeLock()
  })
}

export async function setKeepAwake(enabled: boolean): Promise<void> {
  keepAwake = enabled

  if (enabled && isNativeBridgeAvailable()) {
    try {
      await callNative('keepScreenOn', { enabled: true })
      return
    } catch {
      // Android build without keepScreenOn — fall back to the web wake lock
    }
  }

  if (enabled) {
    ensureVisibilityListener()
    await requestWebWakeLock()
    return
  }

  if (isNativeBridgeAvailable()) {
    await callNative('keepScreenOn', { enabled: false }).catch(() => undefined)
  }

  await releaseWebWakeLock()
}
