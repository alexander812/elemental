import type { ReactNode } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { IconCheck } from '@elemental/icons'
import { Card, Stack, Text } from '@elemental/ui-kit'

import type { Progression } from '../../../../../../lib/types'
import { activeQuests, isQuestDone, questProgress } from '../../../../model/progression'
import type { QuestDef, QuestTier } from '../../../../model/quests'
import { $progression } from '../../../../store'
import { RewardIcon } from '../../../RewardIcon'

import classes from './index.module.pcss'

function QuestRow({
  done,
  progress,
  quest,
}: {
  done: boolean
  progress: number
  quest: QuestDef
}) {
  return (
    <div className={done ? `${classes.row} ${classes.rowDone}` : classes.row}>
      <span className={classes.state}>{done ? <IconCheck fontSize={16} /> : null}</span>
      <Stack grow spacing="xs">
        <Text variant="S / Medium">
          <FormattedMessage {...quest.title} values={{ count: quest.target }} />
        </Text>
        <Text color="contrast-secondary" variant="XS / Medium">
          {done ? (
            <FormattedMessage id="quests_done" defaultMessage="Completed" />
          ) : (
            `${progress}/${quest.target}`
          )}
        </Text>
      </Stack>
      <span className={classes.reward}>
        <RewardIcon kind="coin" size={14} />
        <Text variant="XS / Medium">{quest.coins}</Text>
        <RewardIcon kind="xp" size={14} />
        <Text variant="XS / Medium">{quest.xp}</Text>
      </span>
    </div>
  )
}

function QuestSection({
  progression,
  quests,
  tier,
  title,
}: {
  progression: Progression
  quests: QuestDef[]
  tier: QuestTier
  title: ReactNode
}) {
  if (quests.length === 0) return null

  return (
    <Stack spacing="s">
      <Text color="contrast-secondary" variant="S / Medium">
        {title}
      </Text>
      {quests.map((quest) => (
        <QuestRow
          done={isQuestDone(progression, quest.id, tier)}
          key={quest.id}
          progress={questProgress(progression, quest.id)}
          quest={quest}
        />
      ))}
    </Stack>
  )
}

export function QuestsCard() {
  const progression = useUnit($progression)
  const quests = activeQuests(progression)

  return (
    <Card padding="m">
      <Stack spacing="m">
        <Text variant="M / Medium">
          <FormattedMessage id="progress_quests_title" defaultMessage="Quests" />
        </Text>
        <QuestSection
          progression={progression}
          quests={quests.daily}
          tier="daily"
          title={<FormattedMessage id="progress_quests_daily" defaultMessage="Daily quests" />}
        />
        <QuestSection
          progression={progression}
          quests={quests.weekly}
          tier="weekly"
          title={<FormattedMessage id="progress_quests_weekly" defaultMessage="Weekly quest" />}
        />
        <QuestSection
          progression={progression}
          quests={quests.story}
          tier="story"
          title={<FormattedMessage id="progress_quests_story" defaultMessage="Novice path" />}
        />
        <QuestSection
          progression={progression}
          quests={quests.discovery}
          tier="discovery"
          title={<FormattedMessage id="progress_quests_discovery" defaultMessage="Discover" />}
        />
      </Stack>
    </Card>
  )
}
