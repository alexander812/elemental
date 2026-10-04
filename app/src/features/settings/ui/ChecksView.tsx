import { useUnit } from 'effector-react'

import { Box, Card, Header, Stack, Switch, Text } from '@elemental/ui-kit'

import { popScreen } from '../../navigation/store'
import { $learnAfterChecks, setLearnAfterChecksFx } from '../../theme/store'

export function ChecksView() {
  const learnAfterChecks = useUnit($learnAfterChecks)

  return (
    <Box grow height="100%">
      <Header back text="Проверки" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="m">
          <Card padding="l">
            <Switch
              checked={learnAfterChecks}
              label="Переносить в выученные"
              subLabel="Если произношение и ввод текста верны"
              onChange={(value) => setLearnAfterChecksFx(value)}
            />
          </Card>
          <Text color="contrast-tertiary" variant="XS / Medium">
            Кнопки проверки находятся на карточке под словом оригинала. Проверяется перевод слова.
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}
