export type WordsMerge = {
  merged: string
  removed: Set<string>
  nextWords: string[]
}

export const parseWords = (text: string): string[] => {
  const seen = new Set<string>()
  const words: string[] = []

  text.split(/\s+/).forEach((raw) => {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')

    if (!word) return

    const key = word.toLowerCase()

    if (seen.has(key)) return

    seen.add(key)
    words.push(word)
  })

  return words
}

export const mergeWordsInRange = (words: string[], passed: string[]): WordsMerge | null => {
  const indices = passed
    .map((word) => words.indexOf(word))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)

  if (indices.length < 2) return null

  const first = indices[0]
  const last = indices[indices.length - 1]

  if (first === last) return null

  const removedWords = words.slice(first, last + 1)
  const merged = removedWords.join(' ')

  return {
    merged,
    removed: new Set(removedWords),
    nextWords: [...words.slice(0, first), merged, ...words.slice(last + 1)],
  }
}
