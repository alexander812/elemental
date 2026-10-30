import type { PoliglotPage } from '../../../courses/poliglot/lesson-one'

export type PhraseRun = { attempts: Record<number, number>; failed: number[] }
export const emptyPhraseRun = (): PhraseRun => ({ attempts: {}, failed: [] })

export function recordPhraseAttempt(run: PhraseRun, page: number, correct: boolean): PhraseRun {
  if (run.failed.includes(page)) return run
  const attempts = { ...run.attempts }
  if (correct) {
    delete attempts[page]
    return { ...run, attempts }
  }
  attempts[page] = Math.min(3, (attempts[page] ?? 0) + 1)
  return { attempts, failed: attempts[page] === 3 ? [...run.failed, page] : run.failed }
}

export function phraseRunSummary(pages: PoliglotPage[], solved: number[], failed: number[]) {
  const questions = pages.flatMap((page, index) => (page.kind === 'question' ? [index] : []))
  const correct = questions.filter(
    (index) => solved.includes(index) && !failed.includes(index)
  ).length
  const errors = questions.filter((index) => failed.includes(index)).length
  const unanswered = questions.length - correct - errors
  return {
    correct,
    errors,
    unanswered,
    passed: questions.length > 0 && correct === questions.length && errors === 0,
  }
}
