import { useEffect, useMemo, useState } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { IconEdit, IconEducation, IconMoreVertical, IconPlusBig } from '@elemental/icons'
import {
  Box,
  Button,
  ButtonIcon,
  EmptyScreen,
  Header,
  Menu,
  Spinner,
  Stack, Text,
} from '@elemental/ui-kit'

import { DEFAULT_COURSE_LANG } from '../../../../lib/languages'
import type { CardSet } from '../../../../lib/types'
import { popScreen, pushScreen } from '../../../navigation/store'
import { $lessons } from '../../../lessons/store'
import { ProgressChip } from '../../../progression/ui/ProgressChip'
import { $progressionEnabled } from '../../../theme/store'
import { useRowReorder, ROW_GAP } from '../../../../shared/ui/SwipeRow/useRowReorder'
import {
  fetchSetsFx,
  reorderSetsFx,
  setSetActiveFx,
  $courseLangByLesson,
  $sets,
  $setsLoading,
} from '../../store'
import { SetRow } from './components/SetRow'

export function SetsView({ lessonId }: { lessonId: string }) {
  const sets = useUnit($sets)
  const lessons = useUnit($lessons)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const loading = useUnit($setsLoading)
  const progressionEnabled = useUnit($progressionEnabled)
  const intl = useIntl()

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetchSetsFx()
  }, [])

  const lesson = useMemo(() => lessons.find((item) => item.id === lessonId), [lessons, lessonId])

  const visible = useMemo(
    () =>
      sets
        .filter((set) => set.active && set.lessonId === lessonId)
        .sort((a, b) => a.order - b.order),
    [sets, lessonId]
  )

  const reorder = useRowReorder(
    visible.map((set) => set.id),
    reorderSetsFx
  )

  const handleDelete = (setId: string) => {
    reorder.setOpenRowId(null)
    setSetActiveFx({ setId, active: false })
  }

  const handleTap = (set: CardSet) => {
    if (reorder.openRowId) {
      reorder.setOpenRowId(null)
      return
    }

    const courseLang = courseLangByLesson.get(set.lessonId) ?? DEFAULT_COURSE_LANG
    const hasText = (set.texts[courseLang] ?? '').trim().length > 0

    pushScreen(hasText ? { name: 'set-intro', setId: set.id } : { name: 'cards', setId: set.id })
  }

  const handleEdit = (set: CardSet) => {
    reorder.setOpenRowId(null)
    pushScreen({ name: 'set-create', setId: set.id })
  }

  const handleAddNew = () => {
    pushScreen({ name: 'set-create', lessonId })
  }

  const handleEditLesson = () => {
    pushScreen({ name: 'lesson-create', lessonId })
  }

  const header = (
    <Header
      back
      endToolbar={
        <Menu.Root open={menuOpen} onToggle={setMenuOpen}>
          <Menu.Trigger>
            <ButtonIcon
              ariaLabel={intl.formatMessage({ id: 'sets_lesson_menu', defaultMessage: 'Lesson menu' })}
              icon={<IconMoreVertical fontSize={24} />}
              variant="flat"
            />
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item
              icon={<IconEdit fontSize={16} />}
              label={<FormattedMessage id="sets_edit_lesson" defaultMessage="Edit lesson" />}
              onClick={handleEditLesson}
            />
          </Menu.Content>
        </Menu.Root>
      }
      text={progressionEnabled ? <ProgressChip /> : (lesson?.name ?? '')}
      onBackClick={() => popScreen()}
    />
  )

  if (!lesson) {
    return (
      <Box grow height="100%">
        {header}
        {loading ? (
          <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
            <Spinner size="l" />
          </Stack>
        ) : (
          <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text={<FormattedMessage id="sets_lesson_not_found" defaultMessage="Lesson not found" />} />
        )}
      </Box>
    )
  }

  if (loading && visible.length === 0) {
    return (
      <Box grow height="100%">
        {header}
        <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
          <Spinner size="l" />
        </Stack>
      </Box>
    )
  }

  if (visible.length === 0) {
    return (
      <Box grow height="100%">
        {header}
        <EmptyScreen
          action={
            <Button startIcon={<IconPlusBig fontSize={16} />} onClick={handleAddNew}>
              <FormattedMessage id="sets_add_set" defaultMessage="Add set" />
            </Button>
          }
          fullHeight
          icon={<IconEducation fontSize={24} />}
          text={<FormattedMessage id="sets_empty" defaultMessage="No sets in this lesson yet" />}
        />
      </Box>
    )
  }

  return (
    <Box grow height="100%">
      {header}

      <Box padding="0 m 0 m">
        <Text variant="M / Medium">
          <FormattedMessage id="sets_title" defaultMessage="Sets" />
        </Text>
      </Box>
      <Box grow padding="m">

        <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
          {visible.map((set, index) => (
            <SetRow
              key={set.id}
              index={index}
              reorder={reorder}
              set={set}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onTap={handleTap}
            />
          ))}
        </div>
      </Box>
      <Box padding="m">
        <Button
          fullWidth
          startIcon={<IconPlusBig fontSize={16} />}
          variant="secondary"
          onClick={handleAddNew}
        >
          <FormattedMessage id="sets_add_set" defaultMessage="Add set" />
        </Button>
      </Box>
    </Box>
  )
}
