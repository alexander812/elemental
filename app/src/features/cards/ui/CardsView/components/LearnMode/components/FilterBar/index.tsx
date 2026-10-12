import { IconCheckSmall, IconClose, IconViewList } from '@elemental/icons'
import { Button, ButtonIcon, Stack } from '@elemental/ui-kit'

export type Filter = 'learned' | 'unlearned'

type FilterBarProps = {
  isLearnedFilter: boolean
  learnedCount: number
  unlearnedCount: number
  onFilterChange: (filter: Filter) => void
  onOpenSetText: () => void
}

export function FilterBar({
  isLearnedFilter,
  learnedCount,
  unlearnedCount,
  onFilterChange,
  onOpenSetText,
}: FilterBarProps) {
  return (
    <Stack direction="row" horizontalAlign="space-between">
      <Button
        checked={isLearnedFilter}
        color="neutral"
        startIcon={<IconCheckSmall fontSize={16} />}
        variant="secondary"
        onClick={() => onFilterChange('learned')}
      >
        {learnedCount}
      </Button>
      <ButtonIcon
        ariaLabel="Текст задания"
        color="neutral"
        icon={<IconViewList fontSize={24} />}
        variant="secondary"
        onClick={onOpenSetText}
      />
      <Button
        checked={!isLearnedFilter}
        color="neutral"
        startIcon={<IconClose fontSize={16} />}
        variant="secondary"
        onClick={() => onFilterChange('unlearned')}
      >
        {unlearnedCount}
      </Button>
    </Stack>
  )
}
