import type { MessageDescriptor } from 'react-intl'

import type { Progression } from '../../../lib/types'

// XP закрепляется вехами по 500, а уровни привязаны к объёму курсов:
// Beginner (4 курса) → Practitioner, Beginner + Elementary (6 курсов) → Expert.
// Master и Guru открываются на следующих уровнях курсов.
export const MILESTONE_XP = 500
export const LEVEL_THRESHOLDS = [0, 4000, 8000, 18000, 28000, 40000]
export const GURU_XP = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
export const MAX_LEVEL = LEVEL_THRESHOLDS.length - 1

export const LEVEL_NAMES: MessageDescriptor[] = [
  { id: 'levels_novice', defaultMessage: 'Novice' },
  { id: 'levels_learner', defaultMessage: 'Learner' },
  { id: 'levels_practitioner', defaultMessage: 'Practitioner' },
  { id: 'levels_expert', defaultMessage: 'Expert' },
  { id: 'levels_master', defaultMessage: 'Master' },
  { id: 'levels_guru', defaultMessage: 'Guru' },
]

export const levelIndex = (progression: Progression): number => {
  if (progression.xpLocked >= GURU_XP && progression.certificates.length > 0) return MAX_LEVEL

  let index = 0

  for (let candidate = 0; candidate < MAX_LEVEL; candidate += 1) {
    if (progression.xpLocked >= LEVEL_THRESHOLDS[candidate]) index = candidate
  }

  return index
}

export const isGuruLocked = (progression: Progression): boolean =>
  progression.xpLocked >= GURU_XP && progression.certificates.length === 0

export const nextLevelThreshold = (progression: Progression): number | null => {
  const index = levelIndex(progression)

  if (index >= MAX_LEVEL) return null

  return LEVEL_THRESHOLDS[index + 1]
}

export const levelProgress = (progression: Progression): number => {
  const index = levelIndex(progression)

  if (index >= MAX_LEVEL) return 1

  const xp = progression.xpLocked + progression.xpBurning
  const from = LEVEL_THRESHOLDS[index]
  const to = LEVEL_THRESHOLDS[index + 1]

  if (xp >= to || to <= from) return 1

  return (xp - from) / (to - from)
}
