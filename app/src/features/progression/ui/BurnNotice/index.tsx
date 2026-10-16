import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { Button, Stack, Text } from '@elemental/ui-kit'

import { burnRestorePrice } from '../../model/progression'
import { $activeBurn, $progression, dismissBurnNotice, restoreBurn } from '../../store'

import classes from './index.module.pcss'

export function BurnNotice() {
  const burn = useUnit($activeBurn)
  const progression = useUnit($progression)

  if (!burn) return null

  const price = burnRestorePrice(burn.amount)

  return (
    <div className={classes.overlay}>
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <Text as="h1" align="center" variant="XL / Medium">
          <FormattedMessage id="burn_notice_title" defaultMessage="Temporary XP burned" />
        </Text>
        <Text align="center" color="contrast-secondary" variant="M / Medium">
          <FormattedMessage
            defaultMessage="{amount} XP burned because you skipped two days without practice."
            id="burn_notice_text"
            values={{ amount: burn.amount }}
          />
        </Text>
        <Text align="center" color="contrast-secondary" variant="S / Medium">
          <FormattedMessage
            id="burn_notice_hint"
            defaultMessage="Practice regularly to keep temporary XP, or bring it back within 24 hours."
          />
        </Text>
      </Stack>

      <Stack spacing="s">
        <Button disabled={progression.coins < price} fullWidth onClick={() => restoreBurn()}>
          <FormattedMessage
            defaultMessage="Restore for {price} coins"
            id="burn_notice_restore"
            values={{ price }}
          />
        </Button>
        <Button fullWidth variant="secondary" onClick={() => dismissBurnNotice()}>
          <FormattedMessage id="common_ok" defaultMessage="OK" />
        </Button>
      </Stack>
    </div>
  )
}
