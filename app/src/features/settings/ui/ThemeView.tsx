import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { Box, Card, Header, Radio, Stack } from '@elemental/ui-kit'

import { popScreen } from '../../navigation/store'
import { $theme, setThemeFx } from '../../theme/store'
import type { ThemeName } from '../../../lib/types'

export function ThemeView() {
  const theme = useUnit($theme)

  const handleChange = (value: string) => {
    setThemeFx(value as ThemeName)
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="theme_title" defaultMessage="Theme" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack spacing="s">
          <Card padding="l">
            <Radio name="theme" value={theme} onChange={handleChange}>
              <Stack spacing="l">
                <Radio.Option
                  label={<FormattedMessage id="theme_light" defaultMessage="Light" />}
                  value="light"
                />
                <Radio.Option
                  label={<FormattedMessage id="theme_terracotta" defaultMessage="Terracotta" />}
                  value="terracotta"
                />
                <Radio.Option
                  label={<FormattedMessage id="theme_dark" defaultMessage="Dark" />}
                  value="dark"
                />
                <Radio.Option
                  label={<FormattedMessage id="theme_midnight" defaultMessage="Midnight" />}
                  value="midnight"
                />
                <Radio.Option
                  label={<FormattedMessage id="theme_stone" defaultMessage="Stone" />}
                  value="stone"
                />
                <Radio.Option
                  label={<FormattedMessage id="theme_amethyst" defaultMessage="Amethyst" />}
                  value="amethyst"
                />
              </Stack>
            </Radio>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
