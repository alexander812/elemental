import { useCallback, useEffect, useRef, useState } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { IconChevronRight, IconViewList, IconSound } from '@elemental/icons'
import { BottomSheet, Box, Button, ButtonIcon, Header } from '@elemental/ui-kit'

import type { PoliglotQuestionPage, PoliglotTable } from '../../../courses/poliglot/lesson-one'
import { isPhraseCorrect, normalizePhrase } from '../../../lib/phraseAnswer'
import { playDisappointment, playTestSuccess, unlockSounds } from '../../../lib/sounds'
import { Confetti } from '../../../shared/ui/Confetti'
import { ExamSmiley } from '../../../shared/ui/ExamResults'
import { canSpeak, cancelSpeech } from '../../../transport/speech'
import { speakFx } from '../../cards/store'
import { nextSetScreen, speakErrorText } from '../../cards/ui/CardsView/helpers'
import { popScreen, popTo, replaceScreen, $stack } from '../../navigation/store'
import {
  $courseLangByLesson,
  $sets,
  restartPhraseTaskFx,
  savePhraseTaskProgressFx,
} from '../../sets/store'

import { emptyPhraseRun, phraseRunSummary, recordPhraseAttempt } from '../model/testRun'
import type { PhraseRun } from '../model/testRun'
import { usePageMotion } from './usePageMotion'
import { PagePanel } from './PagePanel'

import classes from './PhraseTaskView.module.pcss'

function accented(text: string) {
  return text.split(/(-?[A-Za-z]+(?:[’'][A-Za-z]+)?)/g).map((part, index) =>
    /^-?[A-Za-z]+(?:[’'][A-Za-z]+)?$/.test(part) ? (
      <span className={classes.english} lang="en" key={index}>
        {part}
      </span>
    ) : (
      part
    )
  )
}

function TheoryTable({
  table,
  titleId,
  interactive,
}: {
  table: PoliglotTable
  titleId: string
  interactive: boolean
}) {
  const intl = useIntl()
  const [speechError, setSpeechError] = useState('')
  const active = useRef(false)
  const isMatrix =
    table.headers.length === 3 &&
    table.headers.every((header, index) => header === ['Вопрос', 'Утверждение', 'Отрицание'][index])
  const spokenColumns =
    table.headers[0] === 'Глагол'
      ? 1
      : ['Начальная форма', 'Обычно'].includes(table.headers[0])
        ? 2
        : 0

  useEffect(() => {
    active.current = interactive
    return () => {
      if (active.current) cancelSpeech()
      active.current = false
    }
  }, [table, interactive])

  const cellContent = (text: string, cell: number) => {
    const [form, ...translation] = text.split('\n')
    if (cell >= spokenColumns) return accented(text)
    return (
      <>
        <div className={classes.spokenForm}>
          <span>{accented(form)}</span>
          {canSpeak() ? (
            <ButtonIcon
              ariaLabel={`${intl.formatMessage({ id: 'cards_card_speak', defaultMessage: 'Speak' })} ${form}`}
              dataTest="phrase-speak"
              icon={<IconSound fontSize={16} />}
              padding="xs"
              size="xs"
              variant="flat"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={async (event) => {
                event.stopPropagation()
                if (!interactive) return
                setSpeechError('')
                try {
                  await speakFx({ text: form, lang: 'en' })
                } catch (error) {
                  if (active.current)
                    setSpeechError(
                      speakErrorText(
                        intl,
                        error instanceof Error ? error : new Error('speak_failed')
                      )
                    )
                }
              }}
            />
          ) : null}
        </div>
        {translation.map((line, index) => (
          <span className={classes.cellTranslation} key={index}>
            {line}
          </span>
        ))}
      </>
    )
  }

  return (
    <>
      <table aria-labelledby={titleId} className={isMatrix ? classes.matrix : undefined}>
        <thead>
          <tr>
            {table.headers.map((text) => (
              <th key={text} scope="col">
                {accented(text)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index}>
              {row.map((text, cell) =>
                cell === 0 && !isMatrix ? (
                  <th key={cell} scope="row">
                    {cellContent(text, cell)}
                  </th>
                ) : (
                  <td key={cell}>{cellContent(text, cell)}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {speechError ? <p role="status">{speechError}</p> : null}
    </>
  )
}

function PhraseQuestion({
  page,
  solved,
  attempts,
  failedQuestion,
  blocked,
  onCheck,
  selected,
  onSelect,
}: {
  page: PoliglotQuestionPage
  solved: boolean
  attempts: number
  failedQuestion: boolean
  blocked: boolean
  onCheck: (words: string[]) => Promise<'correct' | 'retry' | 'failed'>
  selected: number[]
  onSelect: (words: number[]) => void
}) {
  const intl = useIntl()
  const [feedback, setFeedback] = useState<'retry' | 'correct' | 'failed' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const checking = useRef(false)
  const locked = solved || failedQuestion || saving || blocked
  const answer = solved
    ? page.answer.map((word) =>
        page.bank.findIndex((token) => normalizePhrase(token) === normalizePhrase(word))
      )
    : selected

  const check = async () => {
    if (locked || checking.current || selected.length === 0) return
    checking.current = true
    unlockSounds()
    setSaving(true)
    setSaveFailed(false)
    try {
      setFeedback(await onCheck(selected.map((index) => page.bank[index])))
    } catch {
      setSaveFailed(true)
    } finally {
      checking.current = false
      setSaving(false)
    }
  }

  return (
    <section className={classes.question}>
      <p className={classes.instruction}>
        <FormattedMessage id="phrase_build" defaultMessage="Build the English phrase" />
      </p>
      <p className={classes.prompt} lang="ru">
        {page.prompt}
      </p>
      {page.hint ? (
        <p className={classes.hint} lang="ru">
          {page.hint}
        </p>
      ) : null}
      <div
        aria-label={intl.formatMessage({ id: 'phrase_answer', defaultMessage: 'Your answer' })}
        className={classes.answer}
        data-test="phrase-answer"
        lang="en"
        role="group"
      >
        {answer.length === 0 ? (
          <span className={classes.placeholder}>
            <FormattedMessage id="phrase_tap_words" defaultMessage="Tap words below" />
          </span>
        ) : (
          answer.map((index, position) => (
            <button
              className={classes.word}
              disabled={locked}
              key={`${index}-${position}`}
              type="button"
              onClick={() => {
                onSelect(selected.filter((_, itemPosition) => itemPosition !== position))
                setFeedback(null)
              }}
            >
              {page.bank[index]}
            </button>
          ))
        )}
      </div>
      <div
        aria-label={intl.formatMessage({ id: 'phrase_bank', defaultMessage: 'Word bank' })}
        className={classes.bank}
        data-test="phrase-bank"
        lang="en"
        role="group"
      >
        {page.bank.map((word, index) =>
          answer.includes(index) ? null : (
            <button
              className={classes.word}
              disabled={locked}
              key={index}
              type="button"
              onClick={() => {
                onSelect([...selected, index])
                setFeedback(null)
              }}
            >
              {word}
            </button>
          )
        )}
      </div>
      <p
        className={`${classes.feedback} ${failedQuestion ? classes.error : ''}`}
        data-test="phrase-attempts"
        data-attempts={attempts}
        role="status"
        aria-live="polite"
      >
        {saveFailed ? (
          <FormattedMessage id="phrase_save_failed" defaultMessage="Could not save. Try again." />
        ) : failedQuestion ? (
          <FormattedMessage
            id="phrase_three_errors"
            defaultMessage="Three incorrect attempts. This question counts as an error."
          />
        ) : solved || feedback === 'correct' ? (
          <FormattedMessage id="phrase_correct" defaultMessage="Correct!" />
        ) : attempts > 0 ? (
          <FormattedMessage
            id="phrase_attempts_left"
            defaultMessage="Incorrect. Attempts left: {remaining}."
            values={{ remaining: 3 - attempts }}
          />
        ) : null}
      </p>
      <Button disabled={locked || answer.length === 0} fullWidth loading={saving} onClick={check}>
        <FormattedMessage id="phrase_check" defaultMessage="Check" />
      </Button>
    </section>
  )
}

export function PhraseTaskView({ setId }: { setId: string }) {
  const sets = useUnit($sets)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const stack = useUnit($stack)
  const intl = useIntl()
  const set = sets.find((item) => item.id === setId)
  const task = set?.phraseTask
  const pageIndex = Math.max(0, Math.min(task?.pageIndex ?? 0, (task?.pages.length ?? 1) - 1))
  const page = task?.pages[pageIndex]
  const [menuOpen, setMenuOpen] = useState(false)
  const [result, setResult] = useState(
    Boolean(set?.examPassed && task && task.pageIndex === task.pages.length - 1)
  )
  const [saveFailed, setSaveFailed] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [run, setRun] = useState(emptyPhraseRun)
  const runRef = useRef(run)
  const celebrated = useRef(false)
  const active = useRef(false)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [drafts, setDrafts] = useState<Record<number, number[]>>({})
  const scrollPositions = useRef(new Map<number, number>())
  const scrollers = useRef(new Map<number, HTMLDivElement>())
  const restoreScroll = useCallback((index: number) => scrollPositions.current.get(index) ?? 0, [])
  const rememberScroll = useCallback((index: number, top: number) => {
    scrollPositions.current.set(index, top)
  }, [])
  const registerScroller = useCallback((index: number, node: HTMLDivElement | null) => {
    if (node) scrollers.current.set(index, node)
    else scrollers.current.delete(index)
  }, [])
  const clearAuto = () => {
    if (autoTimer.current !== null) clearTimeout(autoTimer.current)
    autoTimer.current = null
  }

  useEffect(() => {
    active.current = true
    const stopWhenHidden = () => {
      if (document.hidden) cancelSpeech()
    }
    document.addEventListener('visibilitychange', stopWhenHidden)
    return () => {
      active.current = false
      clearAuto()
      cancelSpeech()
      document.removeEventListener('visibilitychange', stopWhenHidden)
    }
  }, [])

  const {
    go,
    attachViewport,
    layers,
    phase: pagePhase,
    busy: pageBusy,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  } = usePageMotion(
    result ? (task?.pages.length ?? 0) : pageIndex,
    (task?.pages.length ?? 0) + 1,
    async (target) => {
      if (!task) return
      setSaveFailed(false)
      try {
        await savePhraseTaskProgressFx({
          setId,
          pageIndex: Math.min(target, task.pages.length - 1),
        })
        if (!active.current) return
        setResult(target === task.pages.length)
        if (target !== task.pages.length) setCelebrate(false)
        setMenuOpen(false)
        cancelSpeech()
      } catch (error) {
        setSaveFailed(true)
        throw error
      }
    },
    clearAuto
  )

  const visibleIndex = result ? (task?.pages.length ?? 0) : pageIndex
  useEffect(() => {
    if (pagePhase === 'idle')
      scrollers.current.get(visibleIndex)?.querySelector('h1')?.focus({ preventScroll: true })
  }, [visibleIndex, pagePhase])

  const returnToTasks = () => {
    if (stack.some((screen) => screen.name === 'lesson' && screen.lessonId === set?.lessonId))
      popTo('lesson')
    else if (set) replaceScreen({ name: 'lesson', lessonId: set.lessonId })
    else popScreen()
  }
  const returnToLearning = () => {
    const previous = stack[stack.length - 2]
    if (previous?.name === 'cards' && previous.setId === setId) popScreen()
    else replaceScreen({ name: 'cards', setId })
  }
  if (!set || !task || !page)
    return (
      <div className={classes.host}>
        <Header
          back
          text={<FormattedMessage id="phrase_title" defaultMessage="Phrase practice" />}
          onBackClick={returnToTasks}
        />
        <p className={classes.content}>
          <FormattedMessage id="phrase_missing" defaultMessage="Task not found" />
        </p>
      </div>
    )

  const summary = phraseRunSummary(task.pages, task.solved, run.failed)
  const nextSet = sets
    .filter((item) => item.active && item.lessonId === set.lessonId && item.order > set.order)
    .sort((a, b) => a.order - b.order)[0]
  const record = (index: number, correct: boolean) => {
    const next = recordPhraseAttempt(runRef.current, index, correct)
    runRef.current = next
    setRun(next)
    return next
  }
  const advance = (index: number, solved: number[], nextRun: PhraseRun, wasPassed: boolean) => {
    clearAuto()
    autoTimer.current = setTimeout(
      () => {
        autoTimer.current = null
        if (!active.current) return
        const outcome = phraseRunSummary(task.pages, solved, nextRun.failed)
        const finished = outcome.unanswered === 0 || index === task.pages.length - 1
        const target = finished ? task.pages.length : index + 1
        void go(target).then((moved) => {
          if (!moved || !active.current || !finished || celebrated.current) return
          celebrated.current = true
          if (outcome.passed && !wasPassed) {
            setCelebrate(true)
            playTestSuccess()
          } else if (!outcome.passed) playDisappointment()
        })
      },
      nextRun.failed.includes(index) ? 650 : 450
    )
  }
  const restart = async () => {
    if (restarting || pageBusy) return
    clearAuto()
    setRestarting(true)
    setSaveFailed(false)
    try {
      await restartPhraseTaskFx(setId)
      if (!active.current) return
      const next = emptyPhraseRun()
      runRef.current = next
      setRun(next)
      celebrated.current = false
      setCelebrate(false)
      setResult(false)
      setMenuOpen(false)
      cancelSpeech()
      scrollPositions.current.clear()
      setDrafts({})
    } catch {
      setSaveFailed(true)
    } finally {
      if (active.current) setRestarting(false)
    }
  }

  const renderPage = (layer: { index: number; x: number }) => {
    const index = layer.index
    const isResult = index === task.pages.length
    const renderedPage = task.pages[index] ?? page
    const isCurrent = index === visibleIndex
    const titleId = `phrase-page-title-${setId}-${index}`
    const controls =
      !isResult && renderedPage.kind === 'theory' ? (
        <div className={classes.controls} data-test="phrase-controls">
          <ButtonIcon
            dataTest="phrase-page-prev"
            ariaLabel={intl.formatMessage({ id: 'phrase_back', defaultMessage: 'Back' })}
            icon={<IconChevronRight fontSize={24} style={{ transform: 'rotate(180deg)' }} />}
            disabled={index === 0}
            variant="secondary"
            onClick={() => {
              if (isCurrent) void go(index - 1)
            }}
          />
          <ButtonIcon
            dataTest="phrase-page-next"
            ariaLabel={
              task.pages[index + 1]?.kind === 'question'
                ? intl.formatMessage({ id: 'phrase_start_test', defaultMessage: 'Start test' })
                : intl.formatMessage({ id: 'phrase_next', defaultMessage: 'Next' })
            }
            icon={<IconChevronRight fontSize={24} />}
            variant="secondary"
            onClick={() => {
              if (isCurrent) void go(index + 1)
            }}
          />
        </div>
      ) : undefined
    return (
      <PagePanel
        key={index}
        index={index}
        x={layer.x}
        phase={pagePhase}
        current={isCurrent}
        busy={pageBusy}
        restoreScroll={restoreScroll}
        rememberScroll={rememberScroll}
        registerScroller={registerScroller}
        controls={controls}
      >
        <p className={classes.taskName} lang="ru">
          {set.name}
        </p>
        {isResult ? (
          <section
            className={classes.result}
            data-test="phrase-result"
            data-passed={summary.passed}
          >
            <div className={classes.smiley}>
              <ExamSmiley happy={summary.passed} />
            </div>
            <h1 id={titleId} tabIndex={-1}>
              {summary.passed ? (
                <FormattedMessage id="phrase_passed" defaultMessage="Task completed" />
              ) : (
                <FormattedMessage id="phrase_not_passed" defaultMessage="Test not passed" />
              )}
            </h1>
            {summary.passed ? (
              <p>
                <FormattedMessage
                  id="phrase_all_correct"
                  defaultMessage="All phrases are correct."
                />
              </p>
            ) : (
              <div data-test="phrase-failed" className={classes.error}>
                <p>
                  <FormattedMessage
                    id="phrase_result_errors"
                    defaultMessage="Errors: {count}"
                    values={{ count: summary.errors }}
                  />
                </p>
                {summary.unanswered > 0 ? (
                  <p>
                    <FormattedMessage
                      id="phrase_result_unanswered"
                      defaultMessage="Unanswered: {count}"
                      values={{ count: summary.unanswered }}
                    />
                  </p>
                ) : null}
              </div>
            )}
            <Button fullWidth loading={restarting} disabled={pageBusy} onClick={restart}>
              <FormattedMessage id="phrase_restart" defaultMessage="Start over" />
            </Button>
            {nextSet ? (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  const previous = stack[stack.length - 2]
                  if (previous?.name === 'cards' && previous.setId === setId) popScreen()
                  replaceScreen(
                    nextSetScreen(nextSet, courseLangByLesson.get(set.lessonId) ?? 'en')
                  )
                }}
              >
                <FormattedMessage id="phrase_next_task" defaultMessage="Next task" />
              </Button>
            ) : null}
            {set.cards.length > 0 ? (
              <Button fullWidth variant="secondary" onClick={returnToLearning}>
                <FormattedMessage id="exam_results_back" defaultMessage="Back to learning" />
              </Button>
            ) : null}
            <Button fullWidth variant="secondary" onClick={returnToTasks}>
              <FormattedMessage id="phrase_back_tasks" defaultMessage="Back to tasks" />
            </Button>
          </section>
        ) : (
          <article aria-labelledby={titleId}>
            <h1 id={titleId} lang="ru" tabIndex={-1}>
              {accented(renderedPage.title)}
            </h1>
            {renderedPage.kind === 'theory' ? (
              <div className={classes.theory} lang="ru">
                {renderedPage.paragraphs?.map((text) => (
                  <p key={text}>{accented(text)}</p>
                ))}
                {renderedPage.table ? (
                  <TheoryTable
                    table={renderedPage.table}
                    titleId={titleId}
                    interactive={isCurrent}
                  />
                ) : null}
                {renderedPage.examples?.map((text) => (
                  <p className={classes.example} key={text}>
                    {accented(text)}
                  </p>
                ))}
              </div>
            ) : (
              <PhraseQuestion
                key={`${setId}-${index}`}
                page={renderedPage}
                solved={task.solved.includes(index)}
                attempts={run.attempts[index] ?? 0}
                failedQuestion={run.failed.includes(index)}
                blocked={pageBusy || !isCurrent}
                selected={drafts[index] ?? []}
                onSelect={(words) => setDrafts((value) => ({ ...value, [index]: words }))}
                onCheck={async (words) => {
                  if (!isCurrent || pageBusy) return 'retry'
                  if (runRef.current.failed.includes(index)) return 'failed'
                  if (!isPhraseCorrect(renderedPage.answer, words)) {
                    const nextRun = record(index, false)
                    if (nextRun.failed.includes(index)) {
                      advance(index, task.solved, nextRun, set.examPassed)
                      return 'failed'
                    }
                    return 'retry'
                  }
                  const saved = await savePhraseTaskProgressFx({
                    setId,
                    pageIndex: index,
                    answer: words,
                  })
                  if (!active.current) return 'correct'
                  const solved =
                    saved.find((item) => item.id === setId)?.phraseTask?.solved ?? task.solved
                  advance(index, solved, record(index, true), set.examPassed)
                  return 'correct'
                }}
              />
            )}
          </article>
        )}
      </PagePanel>
    )
  }

  return (
    <div className={classes.host} data-test="phrase-task">
      <Header
        back={page.kind !== 'question' || result}
        dataTestBack="phrase-header-back"
        dataTestContent="phrase-counter"
        textVariant="secondary"
        endToolbar={
          <ButtonIcon
            dataTest="phrase-toc"
            disabled={pageBusy}
            ariaLabel={intl.formatMessage({ id: 'phrase_menu', defaultMessage: 'Task pages' })}
            icon={<IconViewList fontSize={24} />}
            variant="flat"
            onClick={() => {
              clearAuto()
              setMenuOpen(true)
            }}
          />
        }
        text={`${result ? task.pages.length : pageIndex + 1} / ${task.pages.length}`}
        onBackClick={set.cards.length > 0 ? returnToLearning : returnToTasks}
      />
      <div
        className={classes.viewport}
        ref={attachViewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
      >
        {layers.map(renderPage)}
      </div>
      {saveFailed ? (
        <p className={classes.feedback} role="alert">
          <FormattedMessage id="phrase_save_failed" defaultMessage="Could not save. Try again." />
        </p>
      ) : null}
      <BottomSheet opened={menuOpen} onClosed={() => setMenuOpen(false)} dataTest="phrase-pages">
        <nav
          className={classes.pageMenu}
          aria-label={intl.formatMessage({ id: 'phrase_menu', defaultMessage: 'Task pages' })}
        >
          <p className={classes.menuTitle} lang="ru">
            {set.name}
          </p>
          {task.pages.map((item, index) => (
            <button
              aria-current={!result && index === pageIndex ? 'page' : undefined}
              className={classes.pageLink}
              key={index}
              lang="ru"
              type="button"
              disabled={pageBusy}
              onClick={() => void go(index, false)}
            >
              <span>
                {index + 1}. {item.title}
                {item.kind === 'question' ? ` · ${item.prompt}` : ''}
              </span>
              {run.failed.includes(index) ? (
                <span
                  className={classes.error}
                  aria-label={intl.formatMessage({
                    id: 'phrase_result_error',
                    defaultMessage: 'Error',
                  })}
                >
                  ✕
                </span>
              ) : task.solved.includes(index) ? (
                <span aria-hidden="true">✓</span>
              ) : null}
            </button>
          ))}
          <Box padding="m 0 0 0">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => {
                setMenuOpen(false)
                returnToTasks()
              }}
            >
              <FormattedMessage id="phrase_back_tasks" defaultMessage="Back to tasks" />
            </Button>
          </Box>
        </nav>
      </BottomSheet>
      {celebrate && result && summary.passed ? <Confetti /> : null}
    </div>
  )
}
