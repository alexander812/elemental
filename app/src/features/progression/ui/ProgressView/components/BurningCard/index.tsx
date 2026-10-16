import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { Button, Card, Stack, Text } from '@elemental/ui-kit'

import {
  FREEZE_MAX_DAYS,
  FREEZE_PRICE,
  burnRestorePrice,
  pinPrice,
} from '../../../../model/progression'
import {
  $daysUntilBurn,
  $freshBurn,
  $pinCooldown,
  $progression,
  buyFreeze,
  buyPin,
  restoreBurn,
} from '../../../../store'

export function BurningCard() {
  const progression = useUnit($progression)
  const days = useUnit($daysUntilBurn)
  const cooldown = useUnit($pinCooldown)
  const freshBurn = useUnit($freshBurn)

  const burning = progression.xpBurning
  const pinCost = pinPrice(burning)
  const restorePrice = freshBurn ? burnRestorePrice(freshBurn.amount) : 0

  const freezeDisabled =
    burning === 0 || progression.coins < FREEZE_PRICE || progression.frozenDays >= FREEZE_MAX_DAYS
  const pinDisabled = burning === 0 || progression.coins < pinCost || cooldown > 0

  return (
    <Card padding="m">
      <Stack spacing="m">
        <Stack spacing="xs">
          <Stack direction="row" horizontalAlign="space-between" spacing="s">
            <Text color="contrast-secondary" variant="S / Medium">
              <FormattedMessage id="progress_locked_xp" defaultMessage="Permanent XP" />
            </Text>
            <Text variant="S / Medium">{progression.xpLocked}</Text>
          </Stack>
          <Stack direction="row" horizontalAlign="space-between" spacing="s">
            <Text color="contrast-secondary" variant="S / Medium">
              <FormattedMessage id="progress_burning_xp" defaultMessage="Temporary XP" />
            </Text>
            <Text variant="S / Medium">{burning}</Text>
          </Stack>
          <Stack direction="row" horizontalAlign="space-between" spacing="s">
            <Text color="contrast-secondary" variant="S / Medium">
              <FormattedMessage id="progress_coins_label" defaultMessage="Coins" />
            </Text>
            <Text variant="S / Medium">{progression.coins}</Text>
          </Stack>
        </Stack>

        <Text color="contrast-secondary" variant="XS / Medium">
          <FormattedMessage
            id="progress_burn_explainer"
            defaultMessage="Temporary XP burns if you skip two full days without practice. Coins can protect it."
          />
        </Text>

        {burning > 0 ? (
          days <= 1 ? (
            <Text color="warning-text-and-icons" variant="S / Medium">
              <FormattedMessage
                id="progress_burn_tomorrow"
                defaultMessage="Temporary XP burns after one more day without practice"
              />
            </Text>
          ) : (
            <Text color="contrast-secondary" variant="S / Medium">
              <FormattedMessage
                defaultMessage="{days} days left before temporary XP burns"
                id="progress_burn_days"
                values={{ days }}
              />
            </Text>
          )
        ) : null}

        {progression.frozenDays > 0 ? (
          <Text color="contrast-secondary" variant="XS / Medium">
            <FormattedMessage
              defaultMessage="Frozen days: {count} of {max}"
              id="progress_frozen_days"
              values={{ count: progression.frozenDays, max: FREEZE_MAX_DAYS }}
            />
          </Text>
        ) : null}

        {freshBurn ? (
          <Stack spacing="s">
            <Text color="warning-text-and-icons" variant="S / Medium">
              <FormattedMessage
                defaultMessage="{amount} XP burned"
                id="progress_burned"
                values={{ amount: freshBurn.amount }}
              />
            </Text>
            <Button
              disabled={progression.coins < restorePrice}
              fullWidth
              variant="secondary"
              onClick={() => restoreBurn()}
            >
              <FormattedMessage
                defaultMessage="Restore for {price} coins"
                id="progress_restore"
                values={{ price: restorePrice }}
              />
            </Button>
          </Stack>
        ) : null}

        <Stack spacing="s">
          <Button
            disabled={freezeDisabled}
            fullWidth
            variant="secondary"
            onClick={() => buyFreeze()}
          >
            <FormattedMessage
              defaultMessage="Freeze a day · {price} coins"
              id="progress_freeze"
              values={{ price: FREEZE_PRICE }}
            />
          </Button>
          <Button disabled={pinDisabled} fullWidth variant="secondary" onClick={() => buyPin()}>
            <FormattedMessage
              defaultMessage="Protect current XP · {price} coins"
              id="progress_pin"
              values={{ price: pinCost }}
            />
          </Button>
          {cooldown > 0 ? (
            <Text align="center" color="contrast-secondary" variant="XS / Medium">
              <FormattedMessage
                defaultMessage="Protection is available again in {days} days"
                id="progress_pin_cooldown"
                values={{ days: cooldown }}
              />
            </Text>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  )
}
