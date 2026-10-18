import type { PostHog } from 'posthog-js'

import { isNativeBridgeAvailable } from './nativeBridge'

type AnalyticsProperty = string | number | boolean | null | undefined | string[]
type AnalyticsProperties = Record<string, AnalyticsProperty>

type QueuedEvent = {
  event: string
  properties?: AnalyticsProperties
}

const apiKey: string | undefined = import.meta.env.VITE_POSTHOG_KEY
const apiHost: string = import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

let client: PostHog | null = null
let initialization: Promise<void> | null = null
let failed = false
let traits: AnalyticsProperties = {}
let queue: QueuedEvent[] = []

const isStandalone = (): boolean => {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

const baseTraits = (): AnalyticsProperties => ({
  platform: isNativeBridgeAvailable() ? 'android' : 'web',
  standalone: isStandalone(),
  app_version: __APP_VERSION__,
  host: window.location.hostname,
})

const flush = () => {
  if (!client) return

  const events = queue
  queue = []

  for (const event of events) {
    client.capture(event.event, event.properties)
  }
}

const start = (): Promise<void> => {
  if (!apiKey || failed) return Promise.resolve()
  if (initialization) return initialization

  initialization = import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(apiKey, {
        api_host: apiHost,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        cross_subdomain_cookie: true,
        disable_session_recording: true,
        persistence: 'localStorage+cookie',
        person_profiles: 'identified_only',
        respect_dnt: true,
      })

      client = posthog
      posthog.register({ ...baseTraits(), ...traits })
      flush()
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
  if (!apiKey) return

  if (client) {
    client.capture(event, properties)
    return
  }

  if (failed) return

  queue.push({ event, properties })
  void start()
}

export const setAnalyticsTraits = (next: AnalyticsProperties): void => {
  traits = { ...traits, ...next }

  if (client) client.register(traits)
}
