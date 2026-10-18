import { useEffect, useMemo, useRef } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage } from 'react-intl'

import { IconEducation } from '@elemental/icons'
import { Box, EmptyScreen, Header, Spinner, Stack } from '@elemental/ui-kit'

import { track } from '../../../../lib/analytics'
import { DEFAULT_COURSE_LANG, DEFAULT_USER_LANG } from '../../../../lib/languages'
import { $lessons } from '../../../lessons/store'
import { popScreen } from '../../../navigation/store'
import {
  fetchSetsFx,
  $courseLangByLesson,
  $sets,
  $setsLoading,
  $userLangByLesson,
} from '../../../sets/store'
import { taskAnalyticsProperties } from '../../analytics'
import { LearnMode } from './components/LearnMode'

export function CardsView({ setId }: { setId: string }) {
  const sets = useUnit($sets)
  const setsLoading = useUnit($setsLoading)
  const lessons = useUnit($lessons)
  const courseLangByLesson = useUnit($courseLangByLesson)
  const userLangByLesson = useUnit($userLangByLesson)

  useEffect(() => {
    fetchSetsFx()
  }, [])

  const set = useMemo(() => sets.find((item) => item.id === setId), [sets, setId])
  const taskProperties = useMemo(
    () =>
      set
        ? taskAnalyticsProperties(
            set,
            lessons,
            courseLangByLesson.get(set.lessonId) ?? DEFAULT_COURSE_LANG,
            userLangByLesson.get(set.lessonId) ?? DEFAULT_USER_LANG
          )
        : null,
    [set, lessons, courseLangByLesson, userLangByLesson]
  )
  const openedTaskRef = useRef(false)

  useEffect(() => {
    if (!taskProperties || openedTaskRef.current) return

    openedTaskRef.current = true

    track('task_opened', {
      ...taskProperties,
      card_count: set?.cards.filter((card) => !card.deleted).length ?? 0,
    })
  }, [set, taskProperties])

  if (!set) {
    return (
      <Box grow height="100%">
        <Header
          back
          text={<FormattedMessage id="cards_set_title" defaultMessage="Set" />}
          onBackClick={() => popScreen()}
        />
        {setsLoading ? (
          <Stack grow verticalAlign="center" horizontalAlign="center" height="100%">
            <Spinner size="l" />
          </Stack>
        ) : (
          <EmptyScreen
            fullHeight
            icon={<IconEducation fontSize={24} />}
            text={<FormattedMessage id="cards_set_not_found" defaultMessage="Set not found" />}
          />
        )}
      </Box>
    )
  }

  return <LearnMode setId={setId} />
}
