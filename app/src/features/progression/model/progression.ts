import type { Progression, ProgressionCounters } from '../../../lib/types'
import { daysBetween, isoWeekKey, todayIso } from './dates'
import { MILESTONE_XP } from './levels'
import {
  DISCOVERY_QUESTS,
  QUEST_BY_ID,
  STORY_QUESTS,
  pickDailyQuestIds,
  pickWeeklyQuestId,
} from './quests'

export const PROGRESSION_SCHEMA = 1

export const BURN_WINDOW_DAYS = 2
export const FREEZE_PRICE = 50
export const FREEZE_MAX_DAYS = 3
export const PIN_MIN_PRICE = 30
export const PIN_COOLDOWN_DAYS = 2
export const BURN_RESTORE_MIN_PRICE = 50
export const AUTHORING_DAILY_LIMIT = 3
export const ACTIVE_DAYS_KEPT = 14
export const XP_REWARDS = {
  wordLearned: 5,
  checkPassed: 2,
  testPassed: 25,
  testErrorless: 10,
  lessonCompleted: 50,
  courseCompleted: 300,
  authored: 10,
} as const

export const pinPrice = (burning: number): number =>
  Math.max(PIN_MIN_PRICE, Math.ceil(burning / 10))

export const burnRestorePrice = (amount: number): number =>
  Math.max(BURN_RESTORE_MIN_PRICE, Math.ceil(amount / 5))

export type ProgressionEvent =
  | { type: 'wordLearned'; cardId: string }
  | { type: 'checkPassed'; cardId: string; kind: 'voice' | 'write' }
  | { type: 'testCompleted'; setId: string; errorless: boolean }
  | { type: 'lessonCompleted'; lessonId: string }
  | { type: 'courseCompleted'; courseId: string; courseName: string }
  | { type: 'authored'; kind: 'ownSet' | 'fromText' }
  | { type: 'courseLoaded' }
  | { type: 'themeChanged' }
  | { type: 'knowledgeOpened' }
  | { type: 'freeze' }
  | { type: 'pin' }
  | { type: 'restoreBurn' }
  | { type: 'dismissBurn' }
  | { type: 'resumed' }

export const createDefaultProgression = (): Progression => ({
  schema: PROGRESSION_SCHEMA,
  xpLocked: 0,
  xpBurning: 0,
  coins: 0,
  lastActiveDay: null,
  frozenDays: 0,
  activeDays: [],
  authoring: { day: '', count: 0 },
  rewarded: {
    cards: [],
    checks: [],
    sets: [],
    errorlessSets: [],
    lessons: [],
    courses: [],
  },
  counters: {
    day: '',
    dayWords: 0,
    dayTests: 0,
    dayErrorless: 0,
    dayChecks: 0,
    dayLessons: 0,
    dayFromText: 0,
    dayOwnSets: 0,
    week: '',
    weekWords: 0,
    weekTests: 0,
    weekChecks: 0,
    weekLessons: 0,
    totalWords: 0,
    totalTests: 0,
    totalLessons: 0,
    totalOwnSets: 0,
    totalCoursesLoaded: 0,
  },
  flags: { themeChanged: false, knowledgeOpened: false },
  quests: {
    day: '',
    daily: [],
    dailyDone: [],
    week: '',
    weekly: [],
    weeklyDone: [],
    storyDone: [],
    discoveryDone: [],
  },
  burn: null,
  pinDay: null,
  certificates: [],
})

export const isProgression = (value: unknown): value is Progression => {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<Progression>

  return (
    candidate.schema === PROGRESSION_SCHEMA &&
    typeof candidate.xpLocked === 'number' &&
    typeof candidate.xpBurning === 'number' &&
    typeof candidate.coins === 'number' &&
    Array.isArray(candidate.activeDays) &&
    Array.isArray(candidate.certificates) &&
    typeof candidate.authoring === 'object' &&
    candidate.authoring !== null &&
    typeof candidate.counters === 'object' &&
    candidate.counters !== null &&
    typeof candidate.rewarded === 'object' &&
    candidate.rewarded !== null &&
    typeof candidate.flags === 'object' &&
    candidate.flags !== null &&
    typeof candidate.quests === 'object' &&
    candidate.quests !== null
  )
}

export const fullDaysSkipped = (state: Progression, today: string): number =>
  state.lastActiveDay ? Math.max(0, daysBetween(state.lastActiveDay, today) - 1) : 0

export const daysUntilBurn = (state: Progression, today: string): number =>
  BURN_WINDOW_DAYS + state.frozenDays - fullDaysSkipped(state, today)

export const pinCooldownLeft = (state: Progression, today: string): number =>
  state.pinDay ? Math.max(0, PIN_COOLDOWN_DAYS - daysBetween(state.pinDay, today)) : 0

const addXp = (state: Progression, amount: number): Progression => {
  const total = state.xpLocked + state.xpBurning + amount
  const locked = Math.floor(total / MILESTONE_XP) * MILESTONE_XP

  return { ...state, xpLocked: locked, xpBurning: total - locked }
}

const markActive = (state: Progression, today: string): Progression => {
  const activeDays = state.activeDays.includes(today)
    ? state.activeDays
    : [...state.activeDays, today].slice(-ACTIVE_DAYS_KEPT)

  return { ...state, lastActiveDay: today, activeDays }
}

const bump = (state: Progression, patch: Partial<ProgressionCounters>): Progression => ({
  ...state,
  counters: { ...state.counters, ...patch },
})

const normalize = (state: Progression, now: Date): Progression => {
  const day = todayIso(now)
  const week = isoWeekKey(now)
  let next = state

  if (next.counters.day !== day) {
    next = {
      ...next,
      counters: {
        ...next.counters,
        day,
        dayWords: 0,
        dayTests: 0,
        dayErrorless: 0,
        dayChecks: 0,
        dayLessons: 0,
        dayFromText: 0,
        dayOwnSets: 0,
      },
    }
  }

  if (next.quests.day !== day) {
    next = {
      ...next,
      quests: { ...next.quests, day, daily: pickDailyQuestIds(), dailyDone: [] },
    }
  }

  if (next.counters.week !== week) {
    next = {
      ...next,
      counters: { ...next.counters, week, weekWords: 0, weekTests: 0, weekChecks: 0, weekLessons: 0 },
    }
  }

  if (next.quests.week !== week) {
    next = {
      ...next,
      quests: { ...next.quests, week, weekly: [pickWeeklyQuestId()], weeklyDone: [] },
    }
  }

  if (next.authoring.day !== day) {
    next = { ...next, authoring: { day, count: 0 } }
  }

  return next
}

const withBurnCheck = (state: Progression, now: Date): Progression => {
  if (!state.lastActiveDay || state.xpBurning === 0) return state

  if (daysUntilBurn(state, todayIso(now)) > 0) return state

  const amount = state.xpBurning

  return {
    ...state,
    xpBurning: 0,
    frozenDays: 0,
    burn: { amount, at: now.toISOString(), dismissed: false },
  }
}

const applyEvent = (state: Progression, event: ProgressionEvent, now: Date): Progression => {
  const today = todayIso(now)

  switch (event.type) {
    case 'wordLearned': {
      if (state.rewarded.cards.includes(event.cardId)) return state

      const rewarded = { ...state.rewarded, cards: [...state.rewarded.cards, event.cardId] }
      const counters = {
        ...state.counters,
        dayWords: state.counters.dayWords + 1,
        weekWords: state.counters.weekWords + 1,
        totalWords: state.counters.totalWords + 1,
      }

      return addXp(markActive({ ...state, rewarded, counters }, today), XP_REWARDS.wordLearned)
    }

    case 'checkPassed': {
      const key = `${event.kind}:${event.cardId}`

      if (state.rewarded.checks.includes(key)) return state

      const rewarded = { ...state.rewarded, checks: [...state.rewarded.checks, key] }
      const counters = {
        ...state.counters,
        dayChecks: state.counters.dayChecks + 1,
        weekChecks: state.counters.weekChecks + 1,
      }

      return addXp(markActive({ ...state, rewarded, counters }, today), XP_REWARDS.checkPassed)
    }

    case 'testCompleted': {
      if (state.rewarded.sets.includes(event.setId)) return state

      const rewarded = { ...state.rewarded, sets: [...state.rewarded.sets, event.setId] }
      const counters = {
        ...state.counters,
        dayTests: state.counters.dayTests + 1,
        weekTests: state.counters.weekTests + 1,
        totalTests: state.counters.totalTests + 1,
      }
      let next = markActive({ ...state, rewarded, counters }, today)

      next = addXp(next, XP_REWARDS.testPassed)

      if (event.errorless && !next.rewarded.errorlessSets.includes(event.setId)) {
        next = {
          ...next,
          rewarded: {
            ...next.rewarded,
            errorlessSets: [...next.rewarded.errorlessSets, event.setId],
          },
          counters: { ...next.counters, dayErrorless: next.counters.dayErrorless + 1 },
        }
        next = addXp(next, XP_REWARDS.testErrorless)
      }

      return next
    }

    case 'lessonCompleted': {
      if (state.rewarded.lessons.includes(event.lessonId)) return state

      const rewarded = { ...state.rewarded, lessons: [...state.rewarded.lessons, event.lessonId] }
      const counters = {
        ...state.counters,
        dayLessons: state.counters.dayLessons + 1,
        weekLessons: state.counters.weekLessons + 1,
        totalLessons: state.counters.totalLessons + 1,
      }

      return addXp(markActive({ ...state, rewarded, counters }, today), XP_REWARDS.lessonCompleted)
    }

    case 'courseCompleted': {
      if (state.rewarded.courses.includes(event.courseId)) return state

      const rewarded = { ...state.rewarded, courses: [...state.rewarded.courses, event.courseId] }
      const certificate = {
        courseId: event.courseId,
        courseName: event.courseName,
        date: now.toISOString(),
      }

      return addXp(
        markActive({ ...state, rewarded, certificates: [...state.certificates, certificate] }, today),
        XP_REWARDS.courseCompleted
      )
    }

    case 'authored': {
      const counters =
        event.kind === 'ownSet'
          ? {
              ...state.counters,
              dayOwnSets: state.counters.dayOwnSets + 1,
              totalOwnSets: state.counters.totalOwnSets + 1,
            }
          : { ...state.counters, dayFromText: state.counters.dayFromText + 1 }

      if (state.authoring.count >= AUTHORING_DAILY_LIMIT) return { ...state, counters }

      return addXp(
        markActive(
          { ...state, counters, authoring: { day: today, count: state.authoring.count + 1 } },
          today
        ),
        XP_REWARDS.authored
      )
    }

    case 'courseLoaded':
      return bump(state, { totalCoursesLoaded: state.counters.totalCoursesLoaded + 1 })

    case 'themeChanged':
      return state.flags.themeChanged ? state : { ...state, flags: { ...state.flags, themeChanged: true } }

    case 'knowledgeOpened':
      return state.flags.knowledgeOpened
        ? state
        : { ...state, flags: { ...state.flags, knowledgeOpened: true } }

    case 'freeze': {
      if (state.coins < FREEZE_PRICE || state.frozenDays >= FREEZE_MAX_DAYS) return state

      return { ...state, coins: state.coins - FREEZE_PRICE, frozenDays: state.frozenDays + 1 }
    }

    case 'pin': {
      if (state.xpBurning <= 0 || pinCooldownLeft(state, today) > 0) return state

      const price = pinPrice(state.xpBurning)

      if (state.coins < price) return state

      return {
        ...state,
        coins: state.coins - price,
        xpLocked: state.xpLocked + state.xpBurning,
        xpBurning: 0,
        pinDay: today,
      }
    }

    case 'restoreBurn': {
      if (!state.burn) return state

      const fresh = now.getTime() - new Date(state.burn.at).getTime() <= 24 * 3600 * 1000

      if (!fresh) return state

      const price = burnRestorePrice(state.burn.amount)

      if (state.coins < price) return state

      const restored = { ...state, coins: state.coins - price, xpBurning: state.burn.amount, burn: null }

      return addXp(markActive(restored, today), 0)
    }

    case 'dismissBurn':
      return state.burn && !state.burn.dismissed
        ? { ...state, burn: { ...state.burn, dismissed: true } }
        : state

    case 'resumed':
      return { ...markActive(state, today), burn: null }
  }
}

const evaluateQuests = (state: Progression): Progression => {
  let next = state

  for (const id of next.quests.daily) {
    if (next.quests.dailyDone.includes(id)) continue

    const quest = QUEST_BY_ID.get(id)

    if (!quest || quest.metric(next) < quest.target) continue

    next = {
      ...next,
      coins: next.coins + quest.coins,
      quests: { ...next.quests, dailyDone: [...next.quests.dailyDone, quest.id] },
    }
    next = addXp(next, quest.xp)
  }

  for (const id of next.quests.weekly) {
    if (next.quests.weeklyDone.includes(id)) continue

    const quest = QUEST_BY_ID.get(id)

    if (!quest || quest.metric(next) < quest.target) continue

    next = {
      ...next,
      coins: next.coins + quest.coins,
      quests: { ...next.quests, weeklyDone: [...next.quests.weeklyDone, quest.id] },
    }
    next = addXp(next, quest.xp)
  }

  for (const quest of DISCOVERY_QUESTS) {
    if (next.quests.discoveryDone.includes(quest.id)) continue

    if (quest.metric(next) < quest.target) continue

    next = {
      ...next,
      coins: next.coins + quest.coins,
      quests: { ...next.quests, discoveryDone: [...next.quests.discoveryDone, quest.id] },
    }
    next = addXp(next, quest.xp)
  }

  for (const quest of STORY_QUESTS) {
    if (next.quests.storyDone.includes(quest.id)) continue

    if (quest.metric(next) < quest.target) break

    next = {
      ...next,
      coins: next.coins + quest.coins,
      quests: { ...next.quests, storyDone: [...next.quests.storyDone, quest.id] },
    }
    next = addXp(next, quest.xp)
  }

  return next
}

export const applyProgressionEvents = (
  state: Progression,
  events: ProgressionEvent[],
  now: Date = new Date()
): Progression => {
  const today = todayIso(now)
  const resumed = events.some((event) => event.type === 'resumed')
  let next = normalize(state, now)

  if (resumed) {
    next = { ...markActive(next, today), burn: null }
  }

  next = withBurnCheck(next, now)

  for (const event of events) {
    next = applyEvent(next, event, now)
  }

  return evaluateQuests(next)
}

export const activeQuests = (state: Progression) => ({
  daily: state.quests.daily
    .map((id) => QUEST_BY_ID.get(id))
    .filter((quest): quest is NonNullable<typeof quest> => quest !== undefined),
  weekly: state.quests.weekly
    .map((id) => QUEST_BY_ID.get(id))
    .filter((quest): quest is NonNullable<typeof quest> => quest !== undefined),
  story: STORY_QUESTS,
  discovery: DISCOVERY_QUESTS,
})

export const questProgress = (state: Progression, questId: string): number => {
  const quest = QUEST_BY_ID.get(questId)

  return quest ? Math.min(quest.metric(state), quest.target) : 0
}

export const isQuestDone = (
  state: Progression,
  questId: string,
  tier: 'daily' | 'weekly' | 'story' | 'discovery'
): boolean => {
  if (tier === 'daily') return state.quests.dailyDone.includes(questId)
  if (tier === 'weekly') return state.quests.weeklyDone.includes(questId)
  if (tier === 'story') return state.quests.storyDone.includes(questId)

  return state.quests.discoveryDone.includes(questId)
}
