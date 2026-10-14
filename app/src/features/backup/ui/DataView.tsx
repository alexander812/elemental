import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { IconDownload, IconRefresh, IconRestore, IconUpload } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  FormHelperText,
  Header,
  ListItem,
  Stack,
  Text,
} from '@elemental/ui-kit'

import { ConfirmSheet } from '../../../shared/ui/ConfirmSheet'
import { parseBackup, findDuplicateLessons } from '../../../transport/backup'
import type { BackupData, ImportMode } from '../../../transport/backup'
import { $courses } from '../../courses/store'
import { $lessons } from '../../lessons/store'
import { goToRoot, popScreen, pushScreen } from '../../navigation/store'
import { importBackupFx, resetDataFx } from '../store'

export function DataView() {
  const intl = useIntl()
  const courses = useUnit($courses)
  const lessons = useUnit($lessons)
  const importing = useUnit(importBackupFx.pending)
  const resetting = useUnit(resetDataFx.pending)

  const inputRef = useRef<HTMLInputElement>(null)
  const [backup, setBackup] = useState<BackupData | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmMerge, setConfirmMerge] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const cardCount = backup?.sets.reduce((acc, set) => acc + set.cards.length, 0) ?? 0

  const duplicates = useMemo(
    () => (backup ? findDuplicateLessons(backup, courses, lessons) : []),
    [backup, courses, lessons]
  )

  const handleExport = () => {
    setError(null)
    pushScreen({ name: 'export' })
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    try {
      const raw = await file.text()
      setBackup(parseBackup(raw))
      setFileName(file.name)
      setError(null)
    } catch {
      setBackup(null)
      setFileName('')
      setError(
        intl.formatMessage({ id: 'data_read_error', defaultMessage: "Couldn't read the file" })
      )
    }
  }

  const runImport = async (mode: ImportMode) => {
    if (!backup) return

    setConfirmMerge(false)

    try {
      await importBackupFx({ backup, mode })
      goToRoot()
    } catch {
      setError(
        intl.formatMessage({
          id: 'data_import_error',
          defaultMessage: "Couldn't import the data",
        })
      )
    }
  }

  const handleMerge = () => {
    if (!backup) return

    if (duplicates.length > 0) {
      setConfirmMerge(true)
      return
    }

    runImport('merge')
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="data_title" defaultMessage="Data" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack spacing="m">
          <Card padding="0">
            <ListItem data={{ action: 'export' }} onClick={handleExport}>
              <ListItem.StartBlock
                icon={<IconDownload color="var(--accent-text-and-icons)" fontSize={24} />}
                subtitle={
                  <Text color="contrast-secondary" variant="XS / Medium">
                    <FormattedMessage
                      id="data_export_subtitle"
                      defaultMessage="Select lessons and save them to a file"
                    />
                  </Text>
                }
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="data_export" defaultMessage="Export" />
                  </Text>
                }
              />
            </ListItem>
            <ListItem
              data={{ action: 'import' }}
              disabled={importing}
              onClick={() => inputRef.current?.click()}
            >
              <ListItem.StartBlock
                icon={<IconUpload color="var(--accent-text-and-icons)" fontSize={24} />}
                subtitle={
                  <Text color="contrast-secondary" variant="XS / Medium">
                    <FormattedMessage
                      id="data_import_subtitle"
                      defaultMessage="Add or replace lessons from a file"
                    />
                  </Text>
                }
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="data_import" defaultMessage="Import" />
                  </Text>
                }
              />
            </ListItem>
            <ListItem
              data={{ action: 'reset' }}
              disabled={importing || resetting}
              onClick={() => setConfirmReset(true)}
            >
              <ListItem.StartBlock
                icon={<IconRefresh color="var(--accent-text-and-icons)" fontSize={24} />}
                subtitle={
                  <Text color="contrast-secondary" variant="XS / Medium">
                    <FormattedMessage
                      id="data_reset_subtitle"
                      defaultMessage="Go back to the initial state"
                    />
                  </Text>
                }
                title={
                  <Text variant="M / Medium">
                    <FormattedMessage id="data_reset_data" defaultMessage="Reset data" />
                  </Text>
                }
              />
            </ListItem>
          </Card>

          {backup ? (
            <Card padding="l">
              <Stack spacing="m">
                <Stack direction="row" spacing="m" verticalAlign="center">
                  <IconRestore color="var(--accent-text-and-icons)" fontSize={24} />
                  <Stack spacing="xxs">
                    <Text variant="M / Medium">{fileName}</Text>
                    <Text color="contrast-secondary" variant="XS / Medium">
                      <FormattedMessage
                        id="data_backup_summary"
                        defaultMessage="{courses, plural, one {# course} other {# courses}} · {lessons, plural, one {# lesson} other {# lessons}} · {sets, plural, one {# set} other {# sets}} · {cards, plural, one {# card} other {# cards}}"
                        values={{
                          courses: backup.courses.length,
                          lessons: backup.lessons.length,
                          sets: backup.sets.length,
                          cards: cardCount,
                        }}
                      />
                    </Text>
                  </Stack>
                </Stack>
                <FormHelperText variant="warning">
                  <FormattedMessage
                    id="data_merge_warning"
                    defaultMessage={'"Merge" will add the lessons from the file to the current ones, "Replace" will completely replace all the app data'}
                  />
                </FormHelperText>
                <Button fullWidth loading={importing} onClick={handleMerge}>
                  <FormattedMessage id="data_merge" defaultMessage="Merge" />
                </Button>
                <Button
                  disabled={importing}
                  fullWidth
                  variant="secondary"
                  onClick={() => runImport('replace')}
                >
                  <FormattedMessage id="data_import_replace" defaultMessage="Replace" />
                </Button>
                <Button
                  disabled={importing}
                  fullWidth
                  variant="secondary"
                  onClick={() => setBackup(null)}
                >
                  <FormattedMessage id="common_cancel" defaultMessage="Cancel" />
                </Button>
              </Stack>
            </Card>
          ) : null}

          {error ? <FormHelperText variant="error">{error}</FormHelperText> : null}

          <input
            ref={inputRef}
            accept=".json,application/json"
            hidden
            type="file"
            onChange={handleFileChange}
          />
        </Stack>
      </Box>

      <ConfirmSheet
        opened={confirmMerge}
        text={
          <FormattedMessage
            id="data_merge_confirm"
            defaultMessage="These lessons already exist: {duplicates}. The imported lessons will completely overwrite them along with their sets and cards."
            values={{
              duplicates: duplicates
                .map((item) => `«${item.name}» (${item.courseName})`)
                .join(', '),
            }}
          />
        }
        onClosed={() => setConfirmMerge(false)}
      >
        <Button fullWidth loading={importing} onClick={() => runImport('merge')}>
          <FormattedMessage id="common_ok" defaultMessage="OK" />
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setConfirmMerge(false)}>
          <FormattedMessage id="common_cancel" defaultMessage="Cancel" />
        </Button>
      </ConfirmSheet>

      <ConfirmSheet
        opened={confirmReset}
        text={
          <FormattedMessage
            id="data_reset_confirm"
            defaultMessage="All courses, lessons, sets and settings will be deleted with no way to restore them. Go back to the initial state?"
          />
        }
        onClosed={() => setConfirmReset(false)}
      >
        <Button color="negative" fullWidth loading={resetting} onClick={() => resetDataFx()}>
          <FormattedMessage id="data_reset" defaultMessage="Reset" />
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setConfirmReset(false)}>
          <FormattedMessage id="common_cancel" defaultMessage="Cancel" />
        </Button>
      </ConfirmSheet>
    </Box>
  )
}
