import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { Box, Card, Header, Stack, Switch } from '@elemental/ui-kit'

import { popScreen } from '../../../navigation/store'
import { $progressionEnabled, setProgressionEnabledFx } from '../../../theme/store'
import { BurningCard } from './components/BurningCard'
import { CertificatesCard } from './components/CertificatesCard'
import { LevelCard } from './components/LevelCard'
import { QuestsCard } from './components/QuestsCard'

export function ProgressView() {
  const progressionEnabled = useUnit($progressionEnabled)

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="progress_title" defaultMessage="Progress" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack spacing="m">
          <LevelCard />
          <BurningCard />
          <QuestsCard />
          <CertificatesCard />
          <Card padding="l">
            <Switch
              checked={progressionEnabled}
              label={
                <FormattedMessage
                  id="progress_settings_label"
                  defaultMessage="Progress and rewards"
                />
              }
              subLabel={
                <FormattedMessage
                  id="progress_settings_description"
                  defaultMessage="XP, levels, coins and quests for practice. When off, counters are hidden, rewards are not earned, and your progress is kept."
                />
              }
              onChange={(value) => setProgressionEnabledFx(value)}
            />
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
