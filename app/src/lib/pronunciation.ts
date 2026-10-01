const WORD_STRIP = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
const SIMILAR_WORD_COST = 0.34;
const GOOD_SCORE = 0.7;

export type PronunciationWord = {
  matched: boolean;
  text: string;
};

export type PronunciationVerdict = 'good' | 'retry';

export type PronunciationAssessment = {
  score: number;
  transcript: string;
  verdict: PronunciationVerdict;
  words: PronunciationWord[];
};

const normalizeWord = (word: string): string =>
  word.toLowerCase().replace(/ё/g, 'е').replace(WORD_STRIP, '');

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }

    previous = current;
  }

  return previous[b.length];
};

const wordDistance = (a: string, b: string): number => {
  if (a === b) return 0;

  return levenshtein(a, b) / Math.max(a.length, b.length, 1);
};

export function assessPronunciation(
  expected: string,
  transcript: string,
): PronunciationAssessment {
  const expectedTokens = expected
    .split(/\s+/)
    .filter((token) => normalizeWord(token).length > 0);
  const expectedWords = expectedTokens.map(normalizeWord);
  const saidWords = transcript
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  const rows = expectedWords.length;
  const cols = saidWords.length;
  const matched = new Array<boolean>(rows).fill(false);

  if (rows === 0) {
    return { score: 1, transcript, verdict: 'good', words: [] };
  }

  if (cols > 0) {
    const dp: number[][] = Array.from({ length: rows + 1 }, () =>
      new Array<number>(cols + 1).fill(0),
    );

    for (let i = 1; i <= rows; i += 1) dp[i][0] = i;
    for (let j = 1; j <= cols; j += 1) dp[0][j] = j;

    for (let i = 1; i <= rows; i += 1) {
      for (let j = 1; j <= cols; j += 1) {
        const substitution = dp[i - 1][j - 1] + wordDistance(expectedWords[i - 1], saidWords[j - 1]);
        const deletion = dp[i - 1][j] + 1;
        const insertion = dp[i][j - 1] + 1;

        dp[i][j] = Math.min(substitution, deletion, insertion);
      }
    }

    let i = rows;
    let j = cols;

    while (i > 0 && j > 0) {
      const distance = wordDistance(expectedWords[i - 1], saidWords[j - 1]);
      const substitution = dp[i - 1][j - 1] + distance;
      const deletion = dp[i - 1][j] + 1;
      const insertion = dp[i][j - 1] + 1;

      if (substitution <= deletion && substitution <= insertion) {
        if (distance <= SIMILAR_WORD_COST) matched[i - 1] = true;
        i -= 1;
        j -= 1;
      } else if (deletion <= insertion) {
        i -= 1;
      } else {
        j -= 1;
      }
    }
  }

  const matchedCount = matched.filter(Boolean).length;
  const score = matchedCount / rows;

  return {
    score,
    transcript,
    verdict: score >= GOOD_SCORE ? 'good' : 'retry',
    words: expectedTokens.map((text, index) => ({ matched: matched[index], text })),
  };
}
