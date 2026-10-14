import { FormattedMessage } from 'react-intl'

import { IconArrowLeft, IconArrowRight, IconArrowUp } from '@elemental/icons'
import { Stack, Text } from '@elemental/ui-kit'

export function SwipeHints() {
  return (
    <Stack direction="row" horizontalAlign="center" spacing="m" verticalAlign="center">
      <Stack direction="row" spacing="xs" verticalAlign="center">
        <IconArrowLeft color="var(--positive-text-and-icons)" fontSize={16} />
        <Text color="contrast-tertiary" variant="XS / Medium">
          <FormattedMessage id="cards_swipe_learned" defaultMessage="learned" />
        </Text>
      </Stack>
      <Stack direction="row" spacing="xs" verticalAlign="center">
        <IconArrowRight color="var(--warning-text-and-icons)" fontSize={16} />
        <Text color="contrast-tertiary" variant="XS / Medium">
          <FormattedMessage id="cards_swipe_later" defaultMessage="later" />
        </Text>
      </Stack>
      <Stack direction="row" spacing="xs" verticalAlign="center">
        <IconArrowUp color="var(--negative-text-and-icons)" fontSize={16} />
        <Text color="contrast-tertiary" variant="XS / Medium">
          <FormattedMessage id="cards_swipe_delete" defaultMessage="delete" />
        </Text>
      </Stack>
    </Stack>
  )
}
