import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Box, Card, Header, Stack, Switch, Text } from '@elemental/ui-kit'

import { popScreen } from '../../navigation/store'
import { $debugMode, setDebugModeFx } from '../../theme/store'

export function AboutView() {
  const debugMode = useUnit($debugMode)
  const intl = useIntl()

  const buildDate = intl.formatDate(new Date(__BUILD_DATE__), { dateStyle: 'long' })

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="about_title" defaultMessage="About" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack grow height="100%" horizontalAlign="center" spacing="xl" verticalAlign="center">
          <Stack horizontalAlign="center" spacing="s">
            <img
              alt=""
              src={`${import.meta.env.BASE_URL}icons/emblem.svg`}
              style={{ display: 'block', width: 104 }}
            />
            <Text align="center" variant="XXL / Medium">
              Lexi
            </Text>
          </Stack>
          <Text align="center" color="contrast-secondary" variant="S / Medium">
            <FormattedMessage
              id="about_description"
              defaultMessage="Lexi is a flashcard vocabulary trainer. Learn words from set texts, practice pronunciation, and take tests."
            />
          </Text>
          <Stack spacing="xs">
            <Text align="center" color="contrast-tertiary" variant="XS / Medium">
              <FormattedMessage
                id="about_version"
                defaultMessage="Version {version}"
                values={{ version: __APP_VERSION__ }}
              />
            </Text>
            <Text align="center" color="contrast-tertiary" variant="XS / Medium">
              <FormattedMessage
                id="about_build_date"
                defaultMessage="Build date: {date}"
                values={{ date: buildDate }}
              />
            </Text>
          </Stack>
          <Card padding="l" width="100%">
            <Switch
              checked={debugMode}
              label={<FormattedMessage id="about_debug_label" defaultMessage="Debug mode" />}
              subLabel={
                <FormattedMessage
                  id="about_debug_description"
                  defaultMessage="Show what the model recognized when a check fails"
                />
              }
              onChange={(value) => setDebugModeFx(value)}
            />
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
