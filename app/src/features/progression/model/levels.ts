import type { MessageDescriptor } from 'react-intl'

import type { Progression } from '../../../lib/types'

export const MILESTONE_XP = 500
export const GURU_XP = 3000
export const MAX_LEVEL = 5

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

  return Math.min(MAX_LEVEL - 1, Math.floor(progression.xpLocked / MILESTONE_XP))
}

export const isGuruLocked = (progression: Progression): boolean =>
  progression.xpLocked >= GURU_XP && progression.certificates.length === 0

export const nextLevelThreshold = (progression: Progression): number | null => {
  const index = levelIndex(progression)

  if (index >= MAX_LEVEL) return null

  return index === MAX_LEVEL - 1 ? GURU_XP : (index + 1) * MILESTONE_XP
}

export const levelProgress = (progression: Progression): number => {
  const index = levelIndex(progression)

  if (index >= MAX_LEVEL) return 1

  const xp = progression.xpLocked + progression.xpBurning
  const from = index * MILESTONE_XP
  const to = index === MAX_LEVEL - 1 ? GURU_XP : (index + 1) * MILESTONE_XP

  if (xp >= to || to <= from) return 1

  return (xp - from) / (to - from)
}
