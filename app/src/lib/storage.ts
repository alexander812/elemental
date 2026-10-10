const PREFIX = 'app.'

export const DATA_VERSION = 4

type Envelope<T> = {
  data: T
  version: number
}

const isEnvelope = (value: unknown): value is Envelope<unknown> =>
  typeof value === 'object' && value !== null && 'version' in value && 'data' in value

export function load<T>(key: string, fallback: T): T {
  const storageKey = `${PREFIX}${key}`
  const raw = localStorage.getItem(storageKey)

  if (raw === null) return fallback

  try {
    const parsed = JSON.parse(raw) as unknown

    if (isEnvelope(parsed) && parsed.version === DATA_VERSION) {
      return parsed.data as T
    }
  } catch {
    // ignore malformed data
  }

  localStorage.removeItem(storageKey)

  return fallback
}

export function save<T>(key: string, value: T): void {
  const envelope: Envelope<T> = { data: value, version: DATA_VERSION }

  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(envelope))
}

export function remove(key: string): void {
  localStorage.removeItem(`${PREFIX}${key}`)
}

export function clearAll(): void {
  const keys: string[] = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)

    if (key?.startsWith(PREFIX)) keys.push(key)
  }

  keys.forEach((key) => localStorage.removeItem(key))
}
