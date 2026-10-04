import type { LanguageCode } from '../lib/languages'

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single'

type GoogleSegment = [string | null, ...unknown[]]

type GoogleResponse = [GoogleSegment[] | null, ...unknown[]]

export async function translateText(
  text: string,
  from: LanguageCode,
  to: LanguageCode
): Promise<string> {
  const query = text.trim()

  if (!query) return ''

  const params = new URLSearchParams({
    client: 'gtx',
    sl: from,
    tl: to,
    dt: 't',
    q: query,
  })

  const response = await fetch(`${ENDPOINT}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Translate request failed: ${response.status}`)
  }

  const data = (await response.json()) as GoogleResponse
  const translation = (data[0] ?? [])
    .map((segment) => segment[0] ?? '')
    .join('')
    .trim()

  if (!translation) {
    throw new Error('Translate request returned empty result')
  }

  return translation
}
