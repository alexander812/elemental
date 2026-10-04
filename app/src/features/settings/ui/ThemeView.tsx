import { useUnit } from 'effector-react'

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
      <Header back text="Тема" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="s">
          <Card padding="l">
            <Radio name="theme" value={theme} onChange={handleChange}>
              <Stack spacing="l">
                <Radio.Option label="Светлая" value="light" />
                <Radio.Option label="Тёмная" value="dark" />
              </Stack>
            </Radio>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
