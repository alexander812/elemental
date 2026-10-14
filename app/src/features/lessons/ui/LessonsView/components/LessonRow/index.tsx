import { IconCheck } from '@elemental/icons'
import { Stack, Text } from '@elemental/ui-kit'

import type { Lesson } from '../../../../../../lib/types'
import { SwipeRow } from '../../../../../../shared/ui/SwipeRow'

import type { RowReorder } from '../../../../../../shared/ui/SwipeRow/useRowReorder'

type LessonRowProps = {
  examPassed: boolean
  index: number
  lesson: Lesson
  reorder: RowReorder
  onDelete: (lesson: Lesson) => void
  onEdit: (lesson: Lesson) => void
  onTap: (lesson: Lesson) => void
}

export function LessonRow({
  examPassed,
  index,
  lesson,
  reorder,
  onDelete,
  onEdit,
  onTap,
}: LessonRowProps) {
  return (
    <SwipeRow
      {...reorder.rowProps(lesson.id, index)}
      color="primary"
      deleteLabel="Удалить урок"
      editLabel="Редактировать урок"
      onDelete={() => onDelete(lesson)}
      onEdit={() => onEdit(lesson)}
      onTap={() => onTap(lesson)}
    >
      <Stack direction="row" grow height="100%" minWidth={0} spacing="xs" verticalAlign="center">
        {examPassed ? <IconCheck color="var(--positive-text-and-icons)" fontSize={24} /> : null}
        <Text overflow="ellipsis" variant="M / Medium">
          {lesson.name}
        </Text>
      </Stack>
    </SwipeRow>
  )
}
