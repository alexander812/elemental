const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

export const normalizeAnswer = (text: string): string =>
  text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(EDGE_PUNCTUATION, '')
    .replace(/\s+/g, ' ')
    .trim();

export const isAnswerCorrect = (expected: string, entered: string): boolean => {
  const normalized = normalizeAnswer(expected);

  return normalized.length > 0 && normalized === normalizeAnswer(entered);
};
