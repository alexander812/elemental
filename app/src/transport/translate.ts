import type { LanguageCode } from '../lib/languages'

const REQUEST_TIMEOUT_MS = 7000
const RETRY_DELAY_MS = 500
const MIN_REQUEST_INTERVAL_MS = 150

type GoogleSegment = [string | null, ...unknown[]]

type GoogleResponse = [GoogleSegment[] | null, ...unknown[]]

type Translator = {
  buildRequest: (
    text: string,
    from: LanguageCode,
    to: LanguageCode
  ) => { url: string; init?: RequestInit }
  parse: (data: unknown) => string
}

function parseGoogleSegments(data: unknown): string {
  const segments = (data as GoogleResponse)[0] ?? []
  return segments
    .map((segment) => segment?.[0] ?? '')
    .join('')
    .trim()
}

function parseGoogleFlat(data: unknown): string {
  const items = Array.isArray(data) ? data : []
  return items
    .map((item) => (Array.isArray(item) ? item[0] ?? '' : typeof item === 'string' ? item : ''))
    .join('')
    .trim()
}

function parseLibre(data: unknown): string {
  const response = data as { translatedText?: string }
  return (response?.translatedText ?? '').trim()
}

function decodeEntities(text: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&#39;': "'",
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
  }

  return text.replace(/&(?:quot|#39|amp|lt|gt|nbsp);/g, (entity) => entities[entity] ?? entity)
}

function parseMyMemory(data: unknown): string {
  const response = data as {
    responseData?: { translatedText?: string }
    responseStatus?: number | string
  }

  if (response?.responseStatus !== 200 && response?.responseStatus !== '200') return ''

  return decodeEntities(response?.responseData?.translatedText ?? '').trim()
}

const TRANSLATORS: Translator[] = [
  {
    buildRequest: (text, from, to) => ({
      url: `https://translate.googleapis.com/translate_a/single?${new URLSearchParams({
        client: 'gtx',
        sl: from,
        tl: to,
        dt: 't',
        q: text,
      })}`,
    }),
    parse: parseGoogleSegments,
  },
  {
    buildRequest: (text, from, to) => ({
      url: `https://clients5.google.com/translate_a/t?${new URLSearchParams({
        client: 'dict-chrome-ex',
        sl: from,
        tl: to,
        q: text,
      })}`,
    }),
    parse: parseGoogleFlat,
  },
  {
    buildRequest: (text, from, to) => ({
      url: `https://translate.google.com/translate_a/single?${new URLSearchParams({
        client: 'gtx',
        sl: from,
        tl: to,
        dt: 't',
        q: text,
      })}`,
    }),
    parse: parseGoogleSegments,
  },
  {
    buildRequest: (text, from, to) => ({
      url: `https://clients5.google.com/translate_a/single?${new URLSearchParams({
        client: 'gtx',
        sl: from,
        tl: to,
        dt: 't',
        q: text,
      })}`,
    }),
    parse: parseGoogleSegments,
  },
  {
    buildRequest: (text, from, to) => ({
      url: 'https://translate.disroot.org/translate',
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
      },
    }),
    parse: parseLibre,
  },
  {
    buildRequest: (text, from, to) => ({
      url: `https://api.mymemory.translated.net/get?${new URLSearchParams({
        q: text,
        langpair: `${from}|${to}`,
      })}`,
    }),
    parse: parseMyMemory,
  },
]

let lastRequestAt = 0

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now()
  if (wait > 0) await delay(wait)
  lastRequestAt = Date.now()
}

async function requestJson(url: string, init?: RequestInit, retry = true): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, { ...init, signal: controller.signal })

    if (!response.ok) {
      if (retry && (response.status === 429 || response.status >= 500)) {
        await delay(RETRY_DELAY_MS)
        return requestJson(url, init, false)
      }

      throw new Error(`Translate request failed: ${response.status}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function translateText(
  text: string,
  from: LanguageCode,
  to: LanguageCode
): Promise<string> {
  const query = text.trim()

  if (!query) return ''

  await throttle()

  let lastError: unknown

  for (const translator of TRANSLATORS) {
    const { url, init } = translator.buildRequest(query, from, to)

    try {
      const translation = translator.parse(await requestJson(url, init))

      if (translation) return translation

      lastError = new Error('Translate request returned empty result')
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Translate request failed')
}
