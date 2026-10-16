import { combine, createEffect, createEvent, createStore, sample } from 'effector'

import type { Progression } from '../../../lib/types'
import * as progressionApi from '../../../transport/progression'
import { loadCoursesFx } from '../../course-search/store'
import { $courses } from '../../courses/store'
import { $lessons } from '../../lessons/store'
import {
  addCardsFx,
  createSetFx,
  setCardLearnedFx,
  updateCardChecksFx,
  $sets,
} from '../../sets/store'
import {
  setProgressionEnabledFx,
  setThemeFx,
  $progressionEnabled,
  $settingsLoaded,
} from '../../theme/store'
import { buildCompletionEvents } from '../model/completions'
import { todayIso } from '../model/dates'
import { levelIndex } from '../model/levels'
import {
  applyProgressionEvents,
  createDefaultProgression,
  daysUntilBurn,
  isProgression,
  pinCooldownLeft,
} from '../model/progression'
import type { ProgressionEvent } from '../model/progression'

export const progressionEvent = createEvent<ProgressionEvent[]>()
export const queuedProgressionEvent = createEvent<ProgressionEvent[]>()
export const burnCheck = createEvent()
export const buyFreeze = createEvent()
export const buyPin = createEvent()
export const restoreBurn = createEvent()
export const dismissBurnNotice = createEvent()
export const dismissLevelUp = createEvent()
export const testCompleted = createEvent<{ setId: string; errorless: boolean }>()
export const knowledgeOpened = createEvent()

export const fetchProgressionFx = createEffect(() => progressionApi.fetchProgression())

export const saveProgressionFx = createEffect((progression: Progression) =>
  progressionApi.saveProgression(progression)
)

export const $progression = createStore<Progression>(createDefaultProgression())
  .on(fetchProgressionFx.doneData, (_, stored) => {
    const base = isProgression(stored) ? stored : createDefaultProgression()

    if (!$settingsLoaded.getState() || !$progressionEnabled.getState()) return base

    return applyProgressionEvents(base, [])
  })
  .on(progressionEvent, (state, events) => applyProgressionEvents(state, events))

export const $progressionLoaded = createStore(false).on(fetchProgressionFx.finally, () => true)

export const $xpTotal = $progression.map(
  (progression) => progression.xpLocked + progression.xpBurning
)

export const $level = $progression.map(levelIndex)

export const $daysUntilBurn = $progression.map((progression) =>
  daysUntilBurn(progression, todayIso())
)

export const $burnRisk = $progression.map(
  (progression) => progression.xpBurning > 0 && daysUntilBurn(progression, todayIso()) <= 1
)

export const $freshBurn = $progression.map((progression) => {
  if (!progression.burn) return null

  const age = Date.now() - new Date(progression.burn.at).getTime()

  return Number.isFinite(age) && age <= 24 * 3600 * 1000 ? progression.burn : null
})

export const $activeBurn = $freshBurn.map((burn) => (burn && !burn.dismissed ? burn : null))

export const $pinCooldown = $progression.map((progression) =>
  pinCooldownLeft(progression, todayIso())
)

type LevelWatch = { last: number; notice: number | null }

const $levelWatch = createStore<LevelWatch>({ last: 0, notice: null })
  .on(fetchProgressionFx.doneData, (_, stored) => ({
    last: levelIndex(isProgression(stored) ? stored : createDefaultProgression()),
    notice: null,
  }))
  .on($progression, (state, progression) => {
    const next = levelIndex(progression)

    if (next > state.last) return { last: next, notice: next }
    if (next === state.last) return state

    return { last: next, notice: null }
  })
  .on(dismissLevelUp, (state) => (state.notice === null ? state : { ...state, notice: null }))

export const $levelUp = $levelWatch.map((state) => state.notice)

sample({ clock: $progression, target: saveProgressionFx })

sample({
  clock: queuedProgressionEvent,
  source: combine(
    $progressionLoaded,
    $settingsLoaded,
    $progressionEnabled,
    (progressionLoaded, settingsLoaded, enabled) => ({ enabled, progressionLoaded, settingsLoaded })
  ),
  filter: ({ enabled, progressionLoaded, settingsLoaded }) =>
    progressionLoaded && settingsLoaded && enabled,
  fn: (_, events) => events,
  target: progressionEvent,
})

sample({
  clock: combine($progressionLoaded, $settingsLoaded, (loaded, ready) => loaded && ready),
  filter: (ready) => ready,
  fn: (): ProgressionEvent[] => [],
  target: queuedProgressionEvent,
})

sample({
  clock: setProgressionEnabledFx.doneData,
  fn: (settings): ProgressionEvent[] =>
    settings.progressionEnabled ? [{ type: 'resumed' }] : [],
  target: queuedProgressionEvent,
})

sample({
  clock: setCardLearnedFx.done,
  fn: ({ params }): ProgressionEvent[] =>
    params.learned ? [{ type: 'wordLearned', cardId: params.cardId }] : [],
  target: queuedProgressionEvent,
})

sample({
  clock: updateCardChecksFx.done,
  fn: ({ params }): ProgressionEvent[] => {
    const events: ProgressionEvent[] = []

    if (params.checks.voiceCheck === true) {
      events.push({ type: 'checkPassed', cardId: params.cardId, kind: 'voice' })
    }

    if (params.checks.writeCheck === true) {
      events.push({ type: 'checkPassed', cardId: params.cardId, kind: 'write' })
    }

    return events
  },
  target: queuedProgressionEvent,
})

sample({
  clock: testCompleted,
  fn: (payload): ProgressionEvent[] => [
    { type: 'testCompleted', setId: payload.setId, errorless: payload.errorless },
  ],
  target: queuedProgressionEvent,
})

sample({
  clock: createSetFx.done,
  fn: (): ProgressionEvent[] => [{ type: 'authored', kind: 'ownSet' }],
  target: queuedProgressionEvent,
})

sample({
  clock: addCardsFx.done,
  fn: (): ProgressionEvent[] => [{ type: 'authored', kind: 'fromText' }],
  target: queuedProgressionEvent,
})

sample({
  clock: loadCoursesFx.doneData,
  fn: (result): ProgressionEvent[] => (result.status === 'done' ? [{ type: 'courseLoaded' }] : []),
  target: queuedProgressionEvent,
})

sample({
  clock: setThemeFx.done,
  fn: (): ProgressionEvent[] => [{ type: 'themeChanged' }],
  target: queuedProgressionEvent,
})

sample({
  clock: knowledgeOpened,
  fn: (): ProgressionEvent[] => [{ type: 'knowledgeOpened' }],
  target: queuedProgressionEvent,
})

sample({
  clock: burnCheck,
  fn: (): ProgressionEvent[] => [],
  target: queuedProgressionEvent,
})

sample({
  clock: buyFreeze,
  fn: (): ProgressionEvent[] => [{ type: 'freeze' }],
  target: queuedProgressionEvent,
})

sample({
  clock: buyPin,
  fn: (): ProgressionEvent[] => [{ type: 'pin' }],
  target: queuedProgressionEvent,
})

sample({
  clock: restoreBurn,
  fn: (): ProgressionEvent[] => [{ type: 'restoreBurn' }],
  target: queuedProgressionEvent,
})

sample({
  clock: dismissBurnNotice,
  fn: (): ProgressionEvent[] => [{ type: 'dismissBurn' }],
  target: queuedProgressionEvent,
})

sample({
  clock: combine($sets, $lessons, $courses, (sets, lessons, courses) => ({
    sets,
    lessons,
    courses,
  })),
  source: $progression,
  fn: (progression, { sets, lessons, courses }): ProgressionEvent[] =>
    buildCompletionEvents(progression, sets, lessons, courses),
  target: queuedProgressionEvent,
})
