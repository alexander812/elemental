import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Card, ProgressBar, Stack, Text } from '@elemental/ui-kit'

import {
  LEVEL_NAMES,
  isGuruLocked,
  levelProgress,
  nextLevelThreshold,
} from '../../../../model/levels'
import { $level, $progression, $xpTotal } from '../../../../store'
import { LevelBadge } from '../../../LevelBadge'

export function LevelCard() {
  const intl = useIntl()
  const progression = useUnit($progression)
  const level = useUnit($level)
  const xpTotal = useUnit($xpTotal)

  const threshold = nextLevelThreshold(progression)
  const guruLocked = isGuruLocked(progression)
  const remaining = threshold === null ? 0 : Math.max(0, threshold - xpTotal)

  return (
    <Card padding="m">
      <Stack spacing="m">
        <Stack direction="row" spacing="m" verticalAlign="center">
          <LevelBadge level={level} size="l" />
          <Stack grow spacing="xs">
            <Text color="contrast-secondary" variant="S / Medium">
              <FormattedMessage id="progress_level_label" defaultMessage="Level" />
            </Text>
            <Text variant="XL / Medium">
              <FormattedMessage {...LEVEL_NAMES[level]} />
            </Text>
          </Stack>
        </Stack>
        <Stack spacing="xs">
          <Stack direction="row" horizontalAlign="space-between" spacing="s">
            <Text color="contrast-secondary" variant="S / Medium">
              <FormattedMessage id="progress_total_xp" defaultMessage="Total XP" />
            </Text>
            <Text variant="S / Medium">{xpTotal}</Text>
          </Stack>
          <ProgressBar value={levelProgress(progression)} />
          {threshold === null ? (
            <Text color="positive-text-and-icons" variant="XS / Medium">
              <FormattedMessage id="progress_max_level" defaultMessage="Top level reached" />
            </Text>
          ) : guruLocked ? (
            <Text color="warning-text-and-icons" variant="XS / Medium">
              <FormattedMessage
                id="progress_guru_lock"
                defaultMessage="Guru opens when you complete a course"
              />
            </Text>
          ) : (
            <Text color="contrast-secondary" variant="XS / Medium">
              <FormattedMessage
                defaultMessage="{xp} XP to “{level}”"
                id="progress_to_next_level"
                values={{ level: intl.formatMessage(LEVEL_NAMES[level + 1]), xp: remaining }}
              />
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}
