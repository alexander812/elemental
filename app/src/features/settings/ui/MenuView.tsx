import { IconChevronRight, IconSettings, IconTranslate } from '@elemental/icons';
import { Box, Card, Header, ListItem, Stack, Text } from '@elemental/ui-kit';

import { popScreen, pushScreen } from '../../navigation/store';

export function MenuView() {
  return (
    <Box grow height="100%">
      <Header back text="Настройки" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="s">
          <Card padding="0">
            <ListItem
              data={{ screen: 'theme' }}
              onClick={() => pushScreen({ name: 'theme' })}
            >
              <ListItem.StartBlock
                icon={<IconSettings fontSize={24} color="var(--accent-text-and-icons)" />}
                title={<Text variant="M / Medium">Тема</Text>}
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem
              data={{ screen: 'languages' }}
              onClick={() => pushScreen({ name: 'languages' })}
            >
              <ListItem.StartBlock
                icon={<IconTranslate fontSize={24} color="var(--accent-text-and-icons)" />}
                title={<Text variant="M / Medium">Языки</Text>}
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}
