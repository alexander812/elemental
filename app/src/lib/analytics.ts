import { isNativeBridgeAvailable } from './nativeBridge'
import { uid } from './uid'

type AnalyticsProperty = string | number | boolean | null | undefined | string[]
type AnalyticsProperties = Record<string, AnalyticsProperty>

type AmplitudeModule = typeof import('@amplitude/analytics-browser')

type QueuedEvent = {
  event: string
  properties: AnalyticsProperties
}

const apiKey: string | undefined = import.meta.env.VITE_AMPLITUDE_KEY
const serverZone: 'EU' | 'US' =
  import.meta.env.VITE_AMPLITUDE_SERVER_ZONE === 'EU' ? 'EU' : 'US'
const analyticsIdCookie = 'lexi_analytics_id'
const analyticsIdStorage = 'lexi.analytics.id'

const isDntEnabled = (): boolean => {
  const windowWithDnt = window as Window & { doNotTrack?: string }

  return navigator.doNotTrack === '1' || windowWithDnt.doNotTrack === '1'
}

const canTrack = Boolean(apiKey) && !isDntEnabled()

const readCookie = (name: string): string | null => {
  const prefix = `${name}=`
  const part = document.cookie.split('; ').find((item) => item.startsWith(prefix))

  return part ? decodeURIComponent(part.slice(prefix.length)) : null
}

const writeCookie = (name: string, value: string): void => {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const host = window.location.hostname
  const domain = host === 'lexi.casa' || host.endsWith('.lexi.casa') ? '; Domain=.lexi.casa' : ''

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}${domain}`
}

const readStoredId = (): string | null => {
  try {
    return window.localStorage.getItem(analyticsIdStorage)
  } catch {
    return null
  }
}

const storeId = (id: string): void => {
  try {
    window.localStorage.setItem(analyticsIdStorage, id)
  } catch {
    return
  }
}

const ensureAnalyticsId = (): string => {
  const cookieId = readCookie(analyticsIdCookie)

  if (cookieId) {
    storeId(cookieId)
    return cookieId
  }

  const storedId = readStoredId()

  if (storedId) {
    writeCookie(analyticsIdCookie, storedId)
    return storedId
  }

  const id = uid()
  storeId(id)
  writeCookie(analyticsIdCookie, id)

  return id
}

const isStandalone = (): boolean => {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

const baseTraits = (): AnalyticsProperties => ({
  surface: 'app',
  platform: isNativeBridgeAvailable() ? 'android' : 'web',
  standalone: isStandalone(),
  app_version: __APP_VERSION__,
  host: window.location.hostname,
})

let traits: AnalyticsProperties = baseTraits()
let sdk: AmplitudeModule | null = null
let initialization: Promise<void> | null = null
let failed = false
let queue: QueuedEvent[] = []

const flushQueue = (module: AmplitudeModule): void => {
  const events = queue
  queue = []

  for (const item of events) {
    module.track(item.event, item.properties)
  }
}

const start = (): Promise<void> => {
  if (!apiKey || !canTrack || failed) return Promise.resolve()
  if (initialization) return initialization

  initialization = import('@amplitude/analytics-browser')
    .then((module) => {
      const deviceId = ensureAnalyticsId()

      module.init(apiKey, {
        serverZone,
        deviceId,
        appVersion: __APP_VERSION__,
        autocapture: false,
        identityStorage: 'localStorage',
        enableDiagnostics: false,
        enableRequestBodyCompression: false,
        flushIntervalMillis: 1500,
        flushQueueSize: 10,
        remoteConfig: { fetchRemoteConfig: false },
        trackingOptions: { ipAddress: false },
        transport: { type: 'fetch', enableKeepalive: true },
        logLevel: module.Types.LogLevel.None,
      })
      module.setDeviceId(deviceId)

      sdk = module
      flushQueue(module)
    })
    .catch(() => {
      failed = true
      queue = []
    })

  return initialization
}

export const initAnalytics = (): void => {
  void start()
}

export const track = (event: string, properties?: AnalyticsProperties): void => {
  if (!canTrack) return

  const eventProperties = { ...traits, ...properties }

  if (sdk) {
    sdk.track(event, eventProperties)
    return
  }

  if (failed) return

  queue.push({ event, properties: eventProperties })
  void start()
}

export const setAnalyticsTraits = (next: AnalyticsProperties): void => {
  traits = { ...traits, ...next }
}
