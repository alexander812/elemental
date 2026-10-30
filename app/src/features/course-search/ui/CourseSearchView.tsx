import { useEffect, useMemo } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { IconDownload, IconEducation } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  EmptyScreen,
  Header,
  Select,
  Spinner,
  Stack,
  Text,
} from '@elemental/ui-kit'
import type { SelectOption } from '@elemental/ui-kit'

import poliglotCourse from '../../../courses/poliglot/course_poliglot.en.json'
import { getLanguageName } from '../../../lib/languages'
import type { CourseLevel } from '../../../lib/types'
import { ConfirmSheet } from '../../../shared/ui/ConfirmSheet'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import { $userLang } from '../../theme/store'
import {
  courseToggled,
  duplicatesCancelled,
  languageSelected,
  levelSelected,
  loadCoursesFx,
  screenOpened,
  POLIGLOT_COURSE_KEY,
  $catalog,
  $catalogLoaded,
  $catalogLoading,
  $duplicates,
  $language,
  $level,
  $loadPending,
  $selected,
} from '../store'

import classes from './CourseSearchView.module.pcss'

const LEVEL_OPTIONS: SelectOption[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Elementary', value: 'elementary' },
  { label: 'Intermediate', value: 'intermediate', disabled: true },
  { label: 'Upper-Intermediate', value: 'upper-intermediate', disabled: true },
]

export function CourseSearchView() {
  const level = useUnit($level)
  const language = useUnit($language)
  const catalog = useUnit($catalog)
  const catalogLoaded = useUnit($catalogLoaded)
  const catalogLoading = useUnit($catalogLoading)
  const selected = useUnit($selected)
  const loadPending = useUnit($loadPending)
  const duplicates = useUnit($duplicates)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)

  const intl = useIntl()

  useEffect(() => {
    screenOpened()
  }, [])

  const langSelectOptions = useMemo(
    () =>
      languages.map((item) => ({
        label: item.name,
        value: item.code,
        disabled: item.code === userLang,
      })),
    [languages, userLang]
  )

  const fallbackLang = languages.find((item) => item.code !== userLang)?.code ?? language
  const effectiveLang = language !== userLang ? language : fallbackLang

  const selectedEntries = useMemo(
    () => catalog.filter((entry) => selected.has(entry.course)),
    [catalog, selected]
  )

  const duplicatesText = duplicates
    ? duplicates.length === 1
      ? intl.formatMessage(
          {
            id: 'course_search_duplicate_one',
            defaultMessage: 'You already have the course “{name}”. Replace it?',
          },
          { name: duplicates[0] }
        )
      : intl.formatMessage(
          {
            id: 'course_search_duplicate_many',
            defaultMessage: 'You already have the courses {names}. Replace them?',
          },
          { names: duplicates.map((name) => `“${name}”`).join(', ') }
        )
    : ''

  const poliglotSelected = selected.has(POLIGLOT_COURSE_KEY)
  const hasSelection = poliglotSelected || selectedEntries.length > 0

  const handleLoad = (replace: boolean) => {
    if (!level || !hasSelection || loadPending) return

    loadCoursesFx({
      entries: selectedEntries,
      includePoliglot: poliglotSelected,
      level,
      lang: effectiveLang,
      userLang,
      replace,
    })
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="course_search_title" defaultMessage="Ready-made courses" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack height="100%" spacing="m">
          <Text as="h2" variant="L / Medium">
            <FormattedMessage id="course_search_poliglot_section" defaultMessage="Poliglot" />
          </Text>
          <CourseSearchCard
            title={intl.formatMessage({
              id: 'course_search_poliglot_english',
              defaultMessage: 'Poliglot English',
            })}
            description={poliglotCourse.description}
            checked={poliglotSelected}
            disabled={loadPending}
            onToggle={() => courseToggled(POLIGLOT_COURSE_KEY)}
          />
          <Text as="h2" variant="L / Medium">
            <FormattedMessage
              id="course_search_trainers_section"
              defaultMessage="Language trainers"
            />
          </Text>
          <Stack direction="row" spacing="s">
            <Box grow>
              <Select
                fullWidth
                disabled={loadPending}
                options={LEVEL_OPTIONS}
                placeholder={intl.formatMessage({
                  id: 'course_search_level_placeholder',
                  defaultMessage: 'Select level',
                })}
                value={level ?? ''}
                onChange={(value) => levelSelected(value as CourseLevel)}
              />
            </Box>
            <Box grow>
              <Select
                fullWidth
                disabled={loadPending}
                options={langSelectOptions}
                value={effectiveLang}
                onChange={languageSelected}
              />
            </Box>
          </Stack>

          <Box grow>
            {!level ? (
              <EmptyScreen
                fullHeight
                icon={<IconEducation fontSize={24} />}
                text={
                  <FormattedMessage
                    id="course_search_select_level"
                    defaultMessage="Select a level to see ready-made courses"
                  />
                }
              />
            ) : catalogLoading || !catalogLoaded ? (
              <Stack height="100%" horizontalAlign="center" verticalAlign="center">
                <Spinner size="l" />
              </Stack>
            ) : catalog.length === 0 ? (
              <EmptyScreen
                fullHeight
                icon={<IconEducation fontSize={24} />}
                text={
                  <FormattedMessage id="course_search_empty" defaultMessage="No courses found" />
                }
              />
            ) : (
              <div className={classes.list}>
                {catalog.map((entry) => (
                  <CourseSearchCard
                    key={entry.course}
                    title={`${entry.i18n.course[userLang] ?? entry.course} (${getLanguageName(effectiveLang, languages)})`}
                    description={entry.i18n.description[userLang] ?? ''}
                    checked={selected.has(entry.course)}
                    disabled={loadPending}
                    onToggle={() => courseToggled(entry.course)}
                  />
                ))}
              </div>
            )}
          </Box>
        </Stack>
      </Box>

      {level ? (
        <div className={classes.footer}>
          <Button
            disabled={!hasSelection}
            fullWidth
            loading={loadPending}
            startIcon={<IconDownload fontSize={24} />}
            onClick={() => handleLoad(false)}
          >
            <FormattedMessage id="course_search_load" defaultMessage="Load" />
          </Button>
        </div>
      ) : null}

      <ConfirmSheet
        opened={duplicates !== null}
        text={duplicatesText}
        onClosed={() => duplicatesCancelled()}
      >
        <Button fullWidth onClick={() => handleLoad(true)}>
          <FormattedMessage id="course_search_replace" defaultMessage="Replace" />
        </Button>
        <Button fullWidth variant="secondary" onClick={() => duplicatesCancelled()}>
          <FormattedMessage id="common_cancel" defaultMessage="Cancel" />
        </Button>
      </ConfirmSheet>
    </Box>
  )
}

function CourseSearchCard({
  title,
  description,
  checked,
  disabled,
  onToggle,
}: {
  title: string
  description: string
  checked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <Card
      padding="m"
      onClick={() => {
        if (!disabled) onToggle()
      }}
    >
      <Stack spacing="xs">
        <Stack direction="row" horizontalAlign="space-between" spacing="s" verticalAlign="center">
          <div className={classes.checkbox} onClick={(event) => event.stopPropagation()}>
            <Checkbox checked={checked} disabled={disabled} onChange={onToggle} />
          </div>
          <div className={classes.title}>
            <Text overflow="ellipsis" variant="M / Medium">
              {title}
            </Text>
          </div>
        </Stack>
        <div className={classes.description}>
          <Text color="contrast-secondary" variant="XS / Medium">
            {description}
          </Text>
        </div>
      </Stack>
    </Card>
  )
}
