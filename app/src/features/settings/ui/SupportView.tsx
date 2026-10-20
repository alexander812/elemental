import { FormattedMessage } from 'react-intl'

import { IconTelegram } from '@elemental/icons'
import { Box, Button, Card, Header } from '@elemental/ui-kit'

import { popScreen } from '../../navigation/store'

const SUPPORT_BOT_URL = 'https://t.me/lexi_support_bot'

export function SupportView() {
  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="support_title" defaultMessage="Support" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Card padding="l">
          <Button
            fullWidth
            startIcon={<IconTelegram fontSize={24} />}
            onClick={() => window.open(SUPPORT_BOT_URL, '_blank', 'noopener,noreferrer')}
          >
            <FormattedMessage id="support_button" defaultMessage="Support" />
          </Button>
        </Card>
      </Box>
    </Box>
  )
}
