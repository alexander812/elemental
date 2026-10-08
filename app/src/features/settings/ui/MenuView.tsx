import {
  IconChevronRight,
  IconDownload,
  IconPalette,
  IconSound,
  IconTasks,
  IconTranslate,
} from '@elemental/icons'
import { Box, Card, Header, ListItem, Stack, Text } from '@elemental/ui-kit'

import { isNativeBridgeAvailable } from '../../../lib/nativeBridge'
import { popScreen, pushScreen } from '../../navigation/store'

export function MenuView() {
  const voiceManagerAvailable = isNativeBridgeAvailable()

  return (
    <Box grow height="100%">
      <Header back text="Настройки" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="s">
          <Card padding="0">
            <ListItem data={{ screen: 'theme' }} onClick={() => pushScreen({ name: 'theme' })}>
              <ListItem.StartBlock
                icon={<IconPalette fontSize={24} color="var(--accent-text-and-icons)" />}
                title={<Text variant="M / Medium">Тема</Text>}
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem data={{ screen: 'language' }} onClick={() => pushScreen({ name: 'language' })}>
              <ListItem.StartBlock
                icon={<IconTranslate fontSize={24} color="var(--accent-text-and-icons)" />}
                title={<Text variant="M / Medium">Язык</Text>}
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            {voiceManagerAvailable ? (
              <ListItem data={{ screen: 'voices' }} onClick={() => pushScreen({ name: 'voices' })}>
                <ListItem.StartBlock
                  icon={<IconSound fontSize={24} color="var(--accent-text-and-icons)" />}
                  title={<Text variant="M / Medium">Озвучка</Text>}
                />
                <ListItem.EndBlock
                  content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
                />
              </ListItem>
            ) : null}
            <ListItem data={{ screen: 'checks' }} onClick={() => pushScreen({ name: 'checks' })}>
              <ListItem.StartBlock
                icon={<IconTasks fontSize={24} color="var(--accent-text-and-icons)" />}
                title={<Text variant="M / Medium">Проверки</Text>}
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem data={{ screen: 'data' }} onClick={() => pushScreen({ name: 'data' })}>
              <ListItem.StartBlock
                icon={<IconDownload fontSize={24} color="var(--accent-text-and-icons)" />}
                title={<Text variant="M / Medium">Данные</Text>}
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
