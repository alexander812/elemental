import { useMemo } from 'react'

import { IconCheck, IconCheckSmall, IconClose } from '@elemental/icons'
import { Stack, Text } from '@elemental/ui-kit'

import type { CardSet } from '../../../../../../lib/types'
import { SwipeRow } from '../../../../../../shared/ui/SwipeRow'

import type { RowReorder } from '../../../../../../shared/ui/SwipeRow/useRowReorder'

const getCounts = (set: CardSet): { learned: number; notLearned: number } => {
  const learned = set.cards.reduce((acc, card) => (card.learned ? acc + 1 : acc), 0)

  return { learned, notLearned: set.cards.length - learned }
}

type SetRowProps = {
  index: number
  reorder: RowReorder
  set: CardSet
  onDelete: (setId: string) => void
  onEdit: (set: CardSet) => void
  onTap: (set: CardSet) => void
}

export function SetRow({ index, reorder, set, onDelete, onEdit, onTap }: SetRowProps) {
  const { learned, notLearned } = useMemo(() => getCounts(set), [set])

  return (
    <SwipeRow
      {...reorder.rowProps(set.id, index)}
      color="accent"
      deleteLabel="Удалить задание"
      editLabel="Редактировать задание"
      onDelete={() => onDelete(set.id)}
      onEdit={() => onEdit(set)}
      onTap={() => onTap(set)}
    >
      <Stack direction="row" spacing="m" verticalAlign="center" height="100%">
        <Stack direction="row" grow minWidth={0} spacing="xs" verticalAlign="center">
          {set.examPassed ? (
            <IconCheck color="var(--positive-text-and-icons)" fontSize={24} />
          ) : null}
          <Text overflow="ellipsis" variant="M / Medium">
            {set.name}
          </Text>
        </Stack>
        <Stack shrink={0} spacing="xxs" horizontalAlign="end">
          <Stack direction="row" spacing="xxs" verticalAlign="center">
            <IconCheckSmall color="var(--accent-over)" fontSize={16} />
            <Text color="accent-over" variant="S Compact / Medium">
              {learned}
            </Text>
          </Stack>
          <Stack direction="row" spacing="xxs" verticalAlign="center">
            <IconClose color="accent-over" fontSize={16} />
            <Text color="accent-over" variant="S Compact / Medium">
              {notLearned}
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </SwipeRow>
  )
}
