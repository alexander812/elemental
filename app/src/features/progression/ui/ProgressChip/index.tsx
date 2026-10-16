import { useUnit } from 'effector-react'
import { useIntl } from 'react-intl'

import { pushScreen } from '../../../navigation/store'
import { $progressionEnabled } from '../../../theme/store'
import { $burnRisk, $level, $progression, $progressionLoaded, $xpTotal } from '../../store'
import { LevelBadge } from '../LevelBadge'
import { RewardIcon } from '../RewardIcon'
import { useCountUp } from '../useCountUp'
import { useIncreasePulse } from '../useIncreasePulse'

import classes from './index.module.pcss'

export function ProgressChip() {
  const intl = useIntl()
  const loaded = useUnit($progressionLoaded)
  const enabled = useUnit($progressionEnabled)
  const progression = useUnit($progression)
  const level = useUnit($level)
  const xpTotal = useUnit($xpTotal)
  const risky = useUnit($burnRisk)

  const xpDisplay = useCountUp(xpTotal)
  const coinsDisplay = useCountUp(progression.coins)
  const xpPulse = useIncreasePulse(xpTotal)
  const coinsPulse = useIncreasePulse(progression.coins)

  if (!loaded || !enabled) return null

  return (
    <button
      aria-label={intl.formatMessage({
        id: 'progress_chip_aria',
        defaultMessage: 'Your progress: level, XP and coins',
      })}
      className={risky ? `${classes.chip} ${classes.chipRisk}` : classes.chip}
      type="button"
      onClick={() => pushScreen({ name: 'progress' })}
    >
      <LevelBadge level={level} size="s" />
      <span className={classes.metric}>
        <span
          className={`${classes.metricIcon} ${xpPulse > 0 ? classes.wink : ''}`}
          key={`xp-${xpPulse}`}
        >
          <RewardIcon kind="xp" size={16} />
        </span>
        <span className={classes.value}>{xpDisplay}</span>
      </span>
      <span className={classes.metric}>
        <span
          className={`${classes.metricIcon} ${coinsPulse > 0 ? classes.flip : ''}`}
          key={`coins-${coinsPulse}`}
        >
          <RewardIcon kind="coin" size={16} />
        </span>
        <span className={classes.value}>{coinsDisplay}</span>
      </span>
    </button>
  )
}
