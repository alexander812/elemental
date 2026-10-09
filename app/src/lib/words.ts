export type WordSegment = {
  id: string
  text: string
  lineBreak: boolean
}

export type WordsMerge = {
  merged: WordSegment
  removed: Set<string>
  nextWords: WordSegment[]
}

export const parseWords = (text: string): WordSegment[] => {
  const words: WordSegment[] = []
  let lineBreak = false

  text.split(/(\s+)/).forEach((part) => {
    if (!part) return

    if (/^\s+$/.test(part)) {
      if (part.includes('\n')) lineBreak = true
      return
    }

    words.push({ id: `w${words.length}`, text: part, lineBreak })
    lineBreak = false
  })

  return words
}

export const selectedWordTexts = (words: WordSegment[], selected: string[]): string[] => {
  const seen = new Set<string>()
  const texts: string[] = []

  selected.forEach((id) => {
    const text = words.find((segment) => segment.id === id)?.text.trim()

    if (!text) return

    const key = text.toLowerCase()

    if (seen.has(key)) return

    seen.add(key)
    texts.push(text)
  })

  return texts
}

export const mergeWordsInRange = (words: WordSegment[], passed: string[]): WordsMerge | null => {
  const indices = passed
    .map((id) => words.findIndex((segment) => segment.id === id))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)

  if (indices.length < 2) return null

  const first = indices[0]
  const last = indices[indices.length - 1]

  if (first === last) return null

  const removedWords = words.slice(first, last + 1)
  const merged: WordSegment = {
    id: removedWords[0].id,
    text: removedWords.map((segment) => segment.text).join(' '),
    lineBreak: removedWords[0].lineBreak,
  }

  return {
    merged,
    removed: new Set(removedWords.map((segment) => segment.id)),
    nextWords: [...words.slice(0, first), merged, ...words.slice(last + 1)],
  }
}
