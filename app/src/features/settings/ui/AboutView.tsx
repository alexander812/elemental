import { useUnit } from 'effector-react'

import { Box, Card, Header, Stack, Switch, Text } from '@elemental/ui-kit'

import { popScreen } from '../../navigation/store'
import { $debugMode, setDebugModeFx } from '../../theme/store'

const buildDate = new Date(__BUILD_DATE__).toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function AboutView() {
  const debugMode = useUnit($debugMode)

  return (
    <Box grow height="100%">
      <Header back text="О приложении" onBackClick={() => popScreen()} />
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
            Lexi — тренажёр слов по флеш-карточкам. Учите слова из текстов заданий, проверяйте
            произношение и проходите тесты.
          </Text>
          <Stack spacing="xs">
            <Text align="center" color="contrast-tertiary" variant="XS / Medium">
              Версия {__APP_VERSION__}
            </Text>
            <Text align="center" color="contrast-tertiary" variant="XS / Medium">
              Дата сборки: {buildDate}
            </Text>
          </Stack>
          <Card padding="l" width="100%">
            <Switch
              checked={debugMode}
              label="Режим дебага"
              subLabel="Показывать, что распознала модель, если проверка не удалась"
              onChange={(value) => setDebugModeFx(value)}
            />
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
