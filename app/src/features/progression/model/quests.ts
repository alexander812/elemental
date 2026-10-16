import type { MessageDescriptor } from 'react-intl'

import type { Progression } from '../../../lib/types'

export type QuestTier = 'daily' | 'weekly' | 'story' | 'discovery'

export type QuestDef = {
  id: string
  tier: QuestTier
  title: MessageDescriptor
  target: number
  coins: number
  xp: number
  metric: (progression: Progression) => number
}

const DAILY_POOL: QuestDef[] = [
  {
    id: 'daily_words',
    tier: 'daily',
    title: { id: 'quests_daily_words', defaultMessage: 'Learn {count} words' },
    target: 10,
    coins: 20,
    xp: 10,
    metric: (progression) => progression.counters.dayWords,
  },
  {
    id: 'daily_test',
    tier: 'daily',
    title: { id: 'quests_daily_test', defaultMessage: 'Pass a set test' },
    target: 1,
    coins: 20,
    xp: 10,
    metric: (progression) => progression.counters.dayTests,
  },
  {
    id: 'daily_errorless',
    tier: 'daily',
    title: { id: 'quests_daily_errorless', defaultMessage: 'Pass a test with no mistakes' },
    target: 1,
    coins: 25,
    xp: 15,
    metric: (progression) => progression.counters.dayErrorless,
  },
  {
    id: 'daily_checks',
    tier: 'daily',
    title: { id: 'quests_daily_checks', defaultMessage: 'Pass {count} word checks' },
    target: 3,
    coins: 15,
    xp: 10,
    metric: (progression) => progression.counters.dayChecks,
  },
  {
    id: 'daily_lesson',
    tier: 'daily',
    title: { id: 'quests_daily_lesson', defaultMessage: 'Complete a lesson' },
    target: 1,
    coins: 30,
    xp: 15,
    metric: (progression) => progression.counters.dayLessons,
  },
  {
    id: 'daily_from_text',
    tier: 'daily',
    title: { id: 'quests_daily_from_text', defaultMessage: 'Create cards from a text' },
    target: 1,
    coins: 20,
    xp: 10,
    metric: (progression) => progression.counters.dayFromText,
  },
]

const WEEKLY_POOL: QuestDef[] = [
  {
    id: 'weekly_words',
    tier: 'weekly',
    title: { id: 'quests_weekly_words', defaultMessage: 'Learn {count} words' },
    target: 50,
    coins: 100,
    xp: 50,
    metric: (progression) => progression.counters.weekWords,
  },
  {
    id: 'weekly_tests',
    tier: 'weekly',
    title: { id: 'quests_weekly_tests', defaultMessage: 'Pass {count} set tests' },
    target: 5,
    coins: 100,
    xp: 50,
    metric: (progression) => progression.counters.weekTests,
  },
  {
    id: 'weekly_checks',
    tier: 'weekly',
    title: { id: 'quests_weekly_checks', defaultMessage: 'Pass {count} word checks' },
    target: 15,
    coins: 80,
    xp: 40,
    metric: (progression) => progression.counters.weekChecks,
  },
  {
    id: 'weekly_lesson',
    tier: 'weekly',
    title: { id: 'quests_weekly_lesson', defaultMessage: 'Complete a lesson' },
    target: 1,
    coins: 100,
    xp: 50,
    metric: (progression) => progression.counters.weekLessons,
  },
]

export const STORY_QUESTS: QuestDef[] = [
  {
    id: 'story_course',
    tier: 'story',
    title: { id: 'quests_story_course', defaultMessage: 'Load a ready-made course' },
    target: 1,
    coins: 30,
    xp: 30,
    metric: (progression) => progression.counters.totalCoursesLoaded,
  },
  {
    id: 'story_first_word',
    tier: 'story',
    title: { id: 'quests_story_first_word', defaultMessage: 'Learn your first word' },
    target: 1,
    coins: 20,
    xp: 20,
    metric: (progression) => progression.counters.totalWords,
  },
  {
    id: 'story_first_test',
    tier: 'story',
    title: { id: 'quests_story_first_test', defaultMessage: 'Pass your first set test' },
    target: 1,
    coins: 30,
    xp: 30,
    metric: (progression) => progression.counters.totalTests,
  },
  {
    id: 'story_first_lesson',
    tier: 'story',
    title: { id: 'quests_story_first_lesson', defaultMessage: 'Complete your first lesson' },
    target: 1,
    coins: 50,
    xp: 50,
    metric: (progression) => progression.counters.totalLessons,
  },
  {
    id: 'story_three_days',
    tier: 'story',
    title: {
      id: 'quests_story_three_days',
      defaultMessage: 'Practice on {count} different days',
    },
    target: 3,
    coins: 50,
    xp: 50,
    metric: (progression) => progression.activeDays.length,
  },
  {
    id: 'story_ten_tests',
    tier: 'story',
    title: { id: 'quests_story_ten_tests', defaultMessage: 'Pass {count} set tests' },
    target: 10,
    coins: 80,
    xp: 80,
    metric: (progression) => progression.counters.totalTests,
  },
  {
    id: 'story_course_done',
    tier: 'story',
    title: { id: 'quests_story_course_done', defaultMessage: 'Complete a course' },
    target: 1,
    coins: 100,
    xp: 100,
    metric: (progression) => progression.certificates.length,
  },
]

export const DISCOVERY_QUESTS: QuestDef[] = [
  {
    id: 'discover_theme',
    tier: 'discovery',
    title: { id: 'quests_discover_theme', defaultMessage: 'Change the theme' },
    target: 1,
    coins: 20,
    xp: 10,
    metric: (progression) => (progression.flags.themeChanged ? 1 : 0),
  },
  {
    id: 'discover_own_set',
    tier: 'discovery',
    title: { id: 'quests_discover_own_set', defaultMessage: 'Create your own set' },
    target: 1,
    coins: 30,
    xp: 20,
    metric: (progression) => progression.counters.totalOwnSets,
  },
  {
    id: 'discover_video',
    tier: 'discovery',
    title: { id: 'quests_discover_video', defaultMessage: 'Open a video tutorial' },
    target: 1,
    coins: 20,
    xp: 10,
    metric: (progression) => (progression.flags.knowledgeOpened ? 1 : 0),
  },
]

export const DAILY_QUEST_COUNT = 3

const ALL_QUESTS: QuestDef[] = [
  ...DAILY_POOL,
  ...WEEKLY_POOL,
  ...STORY_QUESTS,
  ...DISCOVERY_QUESTS,
]

export const QUEST_BY_ID = new Map(ALL_QUESTS.map((quest) => [quest.id, quest]))

const pickRandom = (count: number): string[] => {
  const pool = [...DAILY_POOL]

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = pool[index]

    pool[index] = pool[swap]
    pool[swap] = current
  }

  return pool.slice(0, count).map((quest) => quest.id)
}

export const pickDailyQuestIds = (): string[] => pickRandom(DAILY_QUEST_COUNT)

export const pickWeeklyQuestId = (): string =>
  WEEKLY_POOL[Math.floor(Math.random() * WEEKLY_POOL.length)].id
