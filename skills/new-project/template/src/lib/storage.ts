const PREFIX = 'app.'

export function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(`${PREFIX}${key}`)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T): void {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
}

export function remove(key: string): void {
  localStorage.removeItem(`${PREFIX}${key}`)
}
