import { useEffect, useMemo } from 'react'

import { useUnit } from 'effector-react'

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
  $catalog,
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
  { label: 'Elementary', value: 'elementary', disabled: true },
  { label: 'Intermediate', value: 'intermediate', disabled: true },
  { label: 'Upper-Intermediate', value: 'upper-intermediate', disabled: true },
]

export function CourseSearchView() {
  const level = useUnit($level)
  const language = useUnit($language)
  const catalog = useUnit($catalog)
  const catalogLoading = useUnit($catalogLoading)
  const selected = useUnit($selected)
  const loadPending = useUnit($loadPending)
  const duplicates = useUnit($duplicates)
  const languages = useUnit($languages)
  const userLang = useUnit($userLang)

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
      ? `Курс «${duplicates[0]}» уже есть у вас. Заменить его?`
      : `Курсы ${duplicates.map((name) => `«${name}»`).join(', ')} уже есть у вас. Заменить их?`
    : ''

  const handleLoad = (replace: boolean) => {
    if (!level || selectedEntries.length === 0) return

    loadCoursesFx({
      entries: selectedEntries,
      level,
      lang: effectiveLang,
      userLang,
      replace,
    })
  }

  return (
    <Box grow height="100%">
      <Header back text="Готовые курсы" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack height="100%" spacing="m">
          <Stack direction="row" spacing="s">
            <Box grow>
              <Select
                fullWidth
                options={LEVEL_OPTIONS}
                placeholder="Выберите уровень"
                value={level ?? ''}
                onChange={(value) => levelSelected(value as CourseLevel)}
              />
            </Box>
            <Box grow>
              <Select
                fullWidth
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
                text="Выберите уровень, чтобы увидеть готовые курсы"
              />
            ) : catalogLoading ? (
              <Stack height="100%" horizontalAlign="center" verticalAlign="center">
                <Spinner size="l" />
              </Stack>
            ) : catalog.length === 0 ? (
              <EmptyScreen fullHeight icon={<IconEducation fontSize={24} />} text="Курсы не найдены" />
            ) : (
              <div className={classes.list}>
                {catalog.map((entry) => (
                  <Card
                    key={entry.course}
                    padding="m"
                    onClick={() => courseToggled(entry.course)}
                  >
                    <Stack spacing="xs">
                      <Stack
                        direction="row"
                        horizontalAlign="space-between"
                        spacing="s"
                        verticalAlign="center"
                      >
                        <Checkbox checked={selected.has(entry.course)} />
                        <div className={classes.title}>
                          <Text overflow="ellipsis" variant="M / Medium">
                            {entry.i18n.course[userLang] ?? entry.course} (
                            {getLanguageName(effectiveLang, languages)})
                          </Text>
                        </div>
                      </Stack>
                      <div className={classes.description}>
                        <Text color="contrast-secondary" variant="XS / Medium">
                          {entry.i18n.description[userLang] ?? ''}
                        </Text>
                      </div>
                    </Stack>
                  </Card>
                ))}
              </div>
            )}
          </Box>
        </Stack>
      </Box>

      {level ? (
        <div className={classes.footer}>
          <Button
            disabled={selectedEntries.length === 0}
            fullWidth
            loading={loadPending}
            startIcon={<IconDownload fontSize={24} />}
            onClick={() => handleLoad(false)}
          >
            Загрузить
          </Button>
        </div>
      ) : null}

      <ConfirmSheet
        opened={duplicates !== null}
        text={duplicatesText}
        onClosed={() => duplicatesCancelled()}
      >
        <Button fullWidth onClick={() => handleLoad(true)}>
          Заменить
        </Button>
        <Button fullWidth variant="secondary" onClick={() => duplicatesCancelled()}>
          Отмена
        </Button>
      </ConfirmSheet>
    </Box>
  )
}
