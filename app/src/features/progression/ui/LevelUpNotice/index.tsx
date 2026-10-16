import { useEffect } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { Stack, Text } from '@elemental/ui-kit'

import { playSalute } from '../../../../lib/sounds'
import { Confetti } from '../../../../shared/ui/Confetti'
import { LEVEL_NAMES } from '../../model/levels'
import { $levelUp, dismissLevelUp } from '../../store'
import { LevelBadge } from '../LevelBadge'

import classes from './index.module.pcss'

const AUTO_DISMISS_MS = 3200

export function LevelUpNotice() {
  const level = useUnit($levelUp)

  useEffect(() => {
    if (level === null) return undefined

    playSalute()

    const timer = setTimeout(() => dismissLevelUp(), AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [level])

  if (level === null) return null

  return (
    <button className={classes.overlay} type="button" onClick={() => dismissLevelUp()}>
      <Confetti />
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <LevelBadge level={level} size="l" />
        <Text as="h1" align="center" variant="L / Medium">
          <FormattedMessage id="levelup_title" defaultMessage="New level!" />
        </Text>
        <Text align="center" variant="XXL / Medium">
          <FormattedMessage {...LEVEL_NAMES[level]} />
        </Text>
      </Stack>
    </button>
  )
}
