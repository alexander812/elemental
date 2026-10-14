import { FormattedMessage } from 'react-intl'

import { IconCheck, IconCheckSmall, IconEducation, IconPlusBig } from '@elemental/icons'
import { Button, EmptyScreen, Stack, Text } from '@elemental/ui-kit'

export type LearnFinishVariant =
  'confirm-delete-set' | 'no-cards' | 'viewed-all' | 'all-learned' | 'viewed-learned' | 'no-learned'

type LearnFinishProps = {
  variant: LearnFinishVariant
  setName: string
  deletePending: boolean
  onAddCard: () => void
  onCancelDeleteSet: () => void
  onConfirmDeleteSet: () => void
  onNextSet: () => void
  onRestart: () => void
}

export function LearnFinish({
  variant,
  setName,
  deletePending,
  onAddCard,
  onCancelDeleteSet,
  onConfirmDeleteSet,
  onNextSet,
  onRestart,
}: LearnFinishProps) {
  if (variant === 'confirm-delete-set') {
    return (
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <Text align="center" color="contrast-secondary" variant="S / Medium">
          <FormattedMessage
            id="cards_finish_delete_confirm"
            defaultMessage={'Delete the set "{setName}" with all its cards?'}
            values={{ setName }}
          />
        </Text>
        <Button color="negative" loading={deletePending} onClick={onConfirmDeleteSet}>
          <FormattedMessage id="common_delete" defaultMessage="Delete" />
        </Button>
        <Button variant="secondary" onClick={onCancelDeleteSet}>
          <FormattedMessage id="common_cancel" defaultMessage="Cancel" />
        </Button>
      </Stack>
    )
  }

  if (variant === 'no-cards') {
    return (
      <EmptyScreen
        action={
          <Button startIcon={<IconPlusBig fontSize={16} />} onClick={onAddCard}>
            <FormattedMessage id="common_add" defaultMessage="Add" />
          </Button>
        }
        fullHeight
        icon={<IconEducation fontSize={24} />}
        text={
          <FormattedMessage
            id="cards_finish_no_cards"
            defaultMessage="There are no cards in this set yet"
          />
        }
      />
    )
  }

  if (variant === 'viewed-all') {
    return (
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <Text align="center" color="contrast-secondary" variant="S / Medium">
          <FormattedMessage
            id="cards_finish_viewed_all"
            defaultMessage="You viewed all the cards"
          />
        </Text>
        <Button onClick={onRestart}>
          <FormattedMessage id="cards_finish_restart" defaultMessage="Start over" />
        </Button>
        <Button variant="secondary" onClick={onNextSet}>
          <FormattedMessage id="cards_finish_next_set" defaultMessage="Go to the next set" />
        </Button>
      </Stack>
    )
  }

  if (variant === 'all-learned') {
    return (
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <IconCheck color="var(--positive-text-and-icons)" fontSize={32} />
        <Text align="center" color="contrast-secondary" variant="S / Medium">
          <FormattedMessage id="cards_finish_all_learned" defaultMessage="All cards learned" />
        </Text>
        <Button variant="secondary" onClick={onNextSet}>
          <FormattedMessage id="cards_finish_next_set" defaultMessage="Go to the next set" />
        </Button>
      </Stack>
    )
  }

  if (variant === 'viewed-learned') {
    return (
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <Text align="center" color="contrast-secondary" variant="S / Medium">
          <FormattedMessage
            id="cards_finish_viewed_learned"
            defaultMessage="You viewed all learned cards"
          />
        </Text>
        <Button onClick={onRestart}>
          <FormattedMessage id="cards_finish_repeat" defaultMessage="Repeat" />
        </Button>
        <Button variant="secondary" onClick={onNextSet}>
          <FormattedMessage id="cards_finish_next_set" defaultMessage="Go to the next set" />
        </Button>
      </Stack>
    )
  }

  return (
    <EmptyScreen
      fullHeight
      icon={<IconCheckSmall fontSize={24} />}
      text={<FormattedMessage id="cards_finish_no_learned" defaultMessage="No learned cards" />}
    />
  )
}
