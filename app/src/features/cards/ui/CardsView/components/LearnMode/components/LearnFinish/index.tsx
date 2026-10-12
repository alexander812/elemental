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
          Удалить задание «{setName}» со всеми карточками?
        </Text>
        <Button color="negative" loading={deletePending} onClick={onConfirmDeleteSet}>
          Удалить
        </Button>
        <Button variant="secondary" onClick={onCancelDeleteSet}>
          Отмена
        </Button>
      </Stack>
    )
  }

  if (variant === 'no-cards') {
    return (
      <EmptyScreen
        action={
          <Button startIcon={<IconPlusBig fontSize={16} />} onClick={onAddCard}>
            Добавить
          </Button>
        }
        fullHeight
        icon={<IconEducation fontSize={24} />}
        text="Пока в задании нет карточек"
      />
    )
  }

  if (variant === 'viewed-all') {
    return (
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <Text align="center" color="contrast-secondary" variant="S / Medium">
          Вы посмотрели все карточки
        </Text>
        <Button onClick={onRestart}>Начать сначала</Button>
        <Button variant="secondary" onClick={onNextSet}>
          Перейти к следующему заданию
        </Button>
      </Stack>
    )
  }

  if (variant === 'all-learned') {
    return (
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <IconCheck color="var(--positive-text-and-icons)" fontSize={32} />
        <Text align="center" color="contrast-secondary" variant="S / Medium">
          Все карточки выучены
        </Text>
        <Button variant="secondary" onClick={onNextSet}>
          Перейти к следующему заданию
        </Button>
      </Stack>
    )
  }

  if (variant === 'viewed-learned') {
    return (
      <Stack grow horizontalAlign="center" spacing="m" verticalAlign="center">
        <Text align="center" color="contrast-secondary" variant="S / Medium">
          Вы посмотрели все выученные карточки
        </Text>
        <Button onClick={onRestart}>Повторить</Button>
        <Button variant="secondary" onClick={onNextSet}>
          Перейти к следующему заданию
        </Button>
      </Stack>
    )
  }

  return (
    <EmptyScreen fullHeight icon={<IconCheckSmall fontSize={24} />} text="Нет выученных карточек" />
  )
}
