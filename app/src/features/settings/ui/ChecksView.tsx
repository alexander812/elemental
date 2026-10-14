import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { Box, Card, Header, Stack, Switch, Text } from '@elemental/ui-kit'

import { popScreen } from '../../navigation/store'
import {
  $learnAfterChecks,
  $voiceCheckEnabled,
  $writeCheckEnabled,
  setLearnAfterChecksFx,
  setVoiceCheckEnabledFx,
  setWriteCheckEnabledFx,
} from '../../theme/store'

export function ChecksView() {
  const learnAfterChecks = useUnit($learnAfterChecks)
  const voiceCheckEnabled = useUnit($voiceCheckEnabled)
  const writeCheckEnabled = useUnit($writeCheckEnabled)

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="checks_title" defaultMessage="Checks" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack spacing="m">
          <Card padding="l">
            <Switch
              checked={voiceCheckEnabled}
              label={
                <FormattedMessage id="checks_voice_label" defaultMessage="Speech recognition" />
              }
              subLabel={
                <FormattedMessage
                  id="checks_voice_description"
                  defaultMessage="Say the word into the microphone to pass the check"
                />
              }
              onChange={(value) => setVoiceCheckEnabledFx(value)}
            />
          </Card>
          <Card padding="l">
            <Switch
              checked={writeCheckEnabled}
              label={<FormattedMessage id="checks_write_label" defaultMessage="Typing" />}
              subLabel={
                <FormattedMessage
                  id="checks_write_description"
                  defaultMessage="Type the word on the keyboard to pass the check"
                />
              }
              onChange={(value) => setWriteCheckEnabledFx(value)}
            />
          </Card>
          <Card padding="l">
            <Switch
              checked={learnAfterChecks}
              label={<FormattedMessage id="checks_learn_label" defaultMessage="Move to learned" />}
              subLabel={
                <FormattedMessage
                  id="checks_learn_description"
                  defaultMessage="If pronunciation and typing are correct"
                />
              }
              onChange={(value) => setLearnAfterChecksFx(value)}
            />
          </Card>
          <Text color="contrast-tertiary" variant="XS / Medium">
            <FormattedMessage
              id="checks_hint"
              defaultMessage="Check buttons are on the front of the card. The course language is checked."
            />
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}
