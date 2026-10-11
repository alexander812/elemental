const WORD_STRIP = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu
const WORD_DIACRITICS = /\p{M}/gu
const WORD_VOWELS = /[aeiouyаеёиоуыэюя]/g
const SIMILAR_WORD_LIMIT = 0.6
const GOOD_SCORE = 0.6

export type PronunciationWord = {
  matched: boolean
  text: string
}

export type PronunciationVerdict = 'good' | 'retry'

export type PronunciationAssessment = {
  score: number
  transcript: string
  verdict: PronunciationVerdict
  words: PronunciationWord[]
}

const collapseDoubles = (word: string): string => word.replace(/(.)\1+/g, '$1')

const normalizeWord = (word: string): string =>
  collapseDoubles(
    word
      .toLowerCase()
      .normalize('NFD')
      .replace(WORD_DIACRITICS, '')
      .replace(WORD_STRIP, '')
  )

const consonantSkeleton = (word: string): string => collapseDoubles(word.replace(WORD_VOWELS, ''))

const editDistance = (a: string, b: string): number => {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let beforePrevious = new Array<number>(b.length + 1).fill(0)
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1

      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost)

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        current[j] = Math.min(current[j], beforePrevious[j - 2] + 1)
      }
    }

    beforePrevious = previous
    previous = current
  }

  return previous[b.length]
}

const wordDistance = (a: string, b: string): number => {
  if (a === b) return 0

  const plain = editDistance(a, b) / Math.max(a.length, b.length, 1)
  const left = consonantSkeleton(a)
  const right = consonantSkeleton(b)
  const skeleton =
    left.length === 0 || right.length === 0
      ? 1
      : editDistance(left, right) / Math.max(left.length, right.length)

  return Math.min(plain, skeleton)
}

const isSimilarWord = (a: string, b: string): boolean => {
  const distance = wordDistance(a, b)

  if (distance > SIMILAR_WORD_LIMIT) return false

  if (a[0] === b[0]) return true

  return a.length > 1 && b.length > 1 && (a.endsWith(b) || b.endsWith(a))
}

export function assessPronunciation(expected: string, transcript: string): PronunciationAssessment {
  const expectedTokens = expected.split(/\s+/).filter((token) => normalizeWord(token).length > 0)
  const expectedWords = expectedTokens.map(normalizeWord)
  const saidWords = transcript.split(/\s+/).map(normalizeWord).filter(Boolean)

  const rows = expectedWords.length
  const cols = saidWords.length
  const matched = new Array<boolean>(rows).fill(false)

  if (rows === 0) {
    return { score: 1, transcript, verdict: 'good', words: [] }
  }

  if (cols > 0) {
    const dp: number[][] = Array.from({ length: rows + 1 }, () =>
      new Array<number>(cols + 1).fill(0)
    )

    for (let i = 1; i <= rows; i += 1) dp[i][0] = i
    for (let j = 1; j <= cols; j += 1) dp[0][j] = j

    for (let i = 1; i <= rows; i += 1) {
      for (let j = 1; j <= cols; j += 1) {
        const substitution = dp[i - 1][j - 1] + wordDistance(expectedWords[i - 1], saidWords[j - 1])
        const deletion = dp[i - 1][j] + 1
        const insertion = dp[i][j - 1] + 1

        dp[i][j] = Math.min(substitution, deletion, insertion)
      }
    }

    let i = rows
    let j = cols

    while (i > 0 && j > 0) {
      const distance = wordDistance(expectedWords[i - 1], saidWords[j - 1])
      const substitution = dp[i - 1][j - 1] + distance
      const deletion = dp[i - 1][j] + 1
      const insertion = dp[i][j - 1] + 1

      if (substitution <= deletion && substitution <= insertion) {
        if (isSimilarWord(expectedWords[i - 1], saidWords[j - 1])) matched[i - 1] = true
        i -= 1
        j -= 1
      } else if (deletion <= insertion) {
        i -= 1
      } else {
        j -= 1
      }
    }
  }

  const matchedCount = matched.filter(Boolean).length
  const score = matchedCount / rows

  return {
    score,
    transcript,
    verdict: score >= GOOD_SCORE ? 'good' : 'retry',
    words: expectedTokens.map((text, index) => ({ matched: matched[index], text })),
  }
}
