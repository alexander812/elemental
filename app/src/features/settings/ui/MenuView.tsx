import { FormattedMessage } from 'react-intl'

import {
  IconBookOpen,
  IconChevronRight,
  IconDownload,
  IconEducation,
  IconMicrophone,
  IconPalette,
  IconSound,
  IconStar,
  IconTasks,
  IconTelegram,
  IconTranslate,
} from '@elemental/icons'
import { Box, Card, Header, ListItem, Stack, Text } from '@elemental/ui-kit'

import { isNativeBridgeAvailable } from '../../../lib/nativeBridge'
import { popScreen, pushScreen } from '../../navigation/store'

export function MenuView() {
  const nativeBridgeAvailable = isNativeBridgeAvailable()

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="settings_title" defaultMessage="Settings" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack spacing="s">
          <Card padding="0">
            <ListItem data={{ screen: 'theme' }} onClick={() => pushScreen({ name: 'theme' })}>
              <ListItem.StartBlock
                icon={<IconPalette fontSize={24} color="var(--accent-text-and-icons)" />}
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="settings_menu_theme" defaultMessage="Theme" />
                  </Text>
                }
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem data={{ screen: 'language' }} onClick={() => pushScreen({ name: 'language' })}>
              <ListItem.StartBlock
                icon={<IconTranslate fontSize={24} color="var(--accent-text-and-icons)" />}
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="settings_menu_language" defaultMessage="Language" />
                  </Text>
                }
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            {nativeBridgeAvailable ? (
              <ListItem data={{ screen: 'voices' }} onClick={() => pushScreen({ name: 'voices' })}>
                <ListItem.StartBlock
                  icon={<IconSound fontSize={24} color="var(--accent-text-and-icons)" />}
                  title={
                    <Text variant="M / Medium">
                      <FormattedMessage id="settings_menu_voices" defaultMessage="Voice" />
                    </Text>
                  }
                />
                <ListItem.EndBlock
                  content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
                />
              </ListItem>
            ) : null}
            {nativeBridgeAvailable ? (
              <ListItem
                data={{ screen: 'recognition' }}
                onClick={() => pushScreen({ name: 'recognition' })}
              >
                <ListItem.StartBlock
                  icon={<IconMicrophone fontSize={24} color="var(--accent-text-and-icons)" />}
                  title={
                    <Text variant="M / Medium">
                      <FormattedMessage
                        id="settings_menu_recognition"
                        defaultMessage="Speech recognition"
                      />
                    </Text>
                  }
                />
                <ListItem.EndBlock
                  content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
                />
              </ListItem>
            ) : null}
            <ListItem data={{ screen: 'checks' }} onClick={() => pushScreen({ name: 'checks' })}>
              <ListItem.StartBlock
                icon={<IconTasks fontSize={24} color="var(--accent-text-and-icons)" />}
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="settings_menu_checks" defaultMessage="Checks" />
                  </Text>
                }
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem data={{ screen: 'progress' }} onClick={() => pushScreen({ name: 'progress' })}>
              <ListItem.StartBlock
                icon={<IconStar fontSize={24} color="var(--accent-text-and-icons)" />}
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="settings_menu_progress" defaultMessage="Progress" />
                  </Text>
                }
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem data={{ screen: 'knowledge' }} onClick={() => pushScreen({ name: 'knowledge' })}>
              <ListItem.StartBlock
                icon={<IconBookOpen fontSize={24} color="var(--accent-text-and-icons)" />}
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage
                      id="settings_menu_knowledge"
                      defaultMessage="Knowledge base"
                    />
                  </Text>
                }
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem data={{ screen: 'support' }} onClick={() => pushScreen({ name: 'support' })}>
              <ListItem.StartBlock
                icon={<IconTelegram fontSize={24} color="var(--accent-text-and-icons)" />}
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="settings_menu_support" defaultMessage="Support" />
                  </Text>
                }
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem data={{ screen: 'about' }} onClick={() => pushScreen({ name: 'about' })}>
              <ListItem.StartBlock
                icon={<IconEducation fontSize={24} color="var(--accent-text-and-icons)" />}
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="settings_menu_about" defaultMessage="About" />
                  </Text>
                }
              />
              <ListItem.EndBlock
                content={<IconChevronRight fontSize={16} color="var(--contrast-tertiary)" />}
              />
            </ListItem>
            <ListItem data={{ screen: 'data' }} onClick={() => pushScreen({ name: 'data' })}>
              <ListItem.StartBlock
                icon={<IconDownload fontSize={24} color="var(--accent-text-and-icons)" />}
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="settings_menu_data" defaultMessage="Data" />
                  </Text>
                }
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
