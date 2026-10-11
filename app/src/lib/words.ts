export type WordSegment = {
  id: string
  text: string
  lineBreak: boolean
  prefix?: string
  suffix?: string
}

export type WordSegmentParts = {
  prefix: string
  text: string
  suffix: string
}

export type WordsMerge = {
  merged: WordSegment
  removed: Set<string>
  nextWords: WordSegment[]
}

const WORD_CHAR = /[\p{L}\p{N}\p{M}]/u

const isWordChar = (char: string) => WORD_CHAR.test(char)

const splitTokenParts = (token: string): WordSegmentParts => {
  let start = 0
  let end = token.length

  while (start < end && !isWordChar(token[start])) start += 1
  while (end > start && !isWordChar(token[end - 1])) end -= 1

  return {
    prefix: token.slice(0, start),
    text: token.slice(start, end),
    suffix: token.slice(end),
  }
}

export const parseSegmentParts = (text: string): WordSegmentParts[] =>
  text.split(' ').filter(Boolean).map(splitTokenParts)

export const parseWords = (text: string): WordSegment[] => {
  const words: WordSegment[] = []
  let lineBreak = false

  text.split(/(\s+)/).forEach((part) => {
    if (!part) return

    if (/^\s+$/.test(part)) {
      if (part.includes('\n')) lineBreak = true
      return
    }

    const { prefix, text: word, suffix } = splitTokenParts(part)

    words.push({ id: `w${words.length}`, text: word, lineBreak, prefix, suffix })
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
    text: removedWords
      .map((segment) => `${segment.prefix ?? ''}${segment.text}${segment.suffix ?? ''}`)
      .join(' '),
    lineBreak: removedWords[0].lineBreak,
  }

  return {
    merged,
    removed: new Set(removedWords.map((segment) => segment.id)),
    nextWords: [...words.slice(0, first), merged, ...words.slice(last + 1)],
  }
}
