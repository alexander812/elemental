import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useUnit } from 'effector-react'

import { IconDownload, IconRestore, IconUpload } from '@elemental/icons'
import {
  Box,
  Button,
  Card,
  FormHelperText,
  Header,
  ListItem,
  Modal,
  Stack,
  Text,
} from '@elemental/ui-kit'

import { parseBackup } from '../../../transport/backup'
import type { BackupData, ImportMode } from '../../../transport/backup'
import { $lessons } from '../../lessons/store'
import { goToRoot, popScreen, pushScreen } from '../../navigation/store'
import { importBackupFx } from '../store'

export function DataView() {
  const lessons = useUnit($lessons)
  const importing = useUnit(importBackupFx.pending)

  const inputRef = useRef<HTMLInputElement>(null)
  const [backup, setBackup] = useState<BackupData | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmMerge, setConfirmMerge] = useState(false)

  const cardCount = backup?.sets.reduce((acc, set) => acc + set.cards.length, 0) ?? 0

  const duplicates = useMemo(() => {
    if (!backup) return []

    const names = new Set(lessons.map((lesson) => lesson.name))

    return [
      ...new Set(
        backup.lessons.filter((lesson) => names.has(lesson.name)).map((lesson) => lesson.name)
      ),
    ]
  }, [backup, lessons])

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
      setError('Не удалось прочитать файл')
    }
  }

  const runImport = async (mode: ImportMode) => {
    if (!backup) return

    setConfirmMerge(false)

    try {
      await importBackupFx({ backup, mode })
      goToRoot()
    } catch {
      setError('Не удалось импортировать данные')
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
      <Header back text="Данные" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="m">
          <Card padding="0">
            <ListItem data={{ action: 'export' }} onClick={handleExport}>
              <ListItem.StartBlock
                icon={<IconDownload color="var(--accent-text-and-icons)" fontSize={24} />}
                subtitle={
                  <Text color="contrast-secondary" variant="XS / Medium">
                    Выбрать уроки и сохранить в файл
                  </Text>
                }
                title={<Text variant="M / Medium">Экспортировать</Text>}
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
                    Добавить или заменить уроки из файла
                  </Text>
                }
                title={<Text variant="M / Medium">Импортировать</Text>}
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
                      {backup.lessons.length} уроков · {backup.sets.length} наборов · {cardCount}{' '}
                      карточек
                    </Text>
                  </Stack>
                </Stack>
                <FormHelperText variant="warning">
                  «Слияние» добавит уроки из файла к текущим, «Замена» полностью заменит все данные
                  приложения
                </FormHelperText>
                <Button fullWidth loading={importing} onClick={handleMerge}>
                  Слияние
                </Button>
                <Button
                  disabled={importing}
                  fullWidth
                  variant="secondary"
                  onClick={() => runImport('replace')}
                >
                  Замена
                </Button>
                <Button
                  disabled={importing}
                  fullWidth
                  variant="secondary"
                  onClick={() => setBackup(null)}
                >
                  Отмена
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

      <Modal open={confirmMerge} onClose={() => setConfirmMerge(false)}>
        <Stack spacing="m" horizontalAlign="center">
          <Text align="center" variant="S / Medium">
            Уроки с такими названиями уже есть: {duplicates.map((name) => `«${name}»`).join(', ')}.
            Импортируемые уроки полностью перезапишут их вместе с наборами и карточками.
          </Text>
          <Button fullWidth loading={importing} onClick={() => runImport('merge')}>
            ОК
          </Button>
          <Button fullWidth variant="secondary" onClick={() => setConfirmMerge(false)}>
            Отмена
          </Button>
        </Stack>
      </Modal>
    </Box>
  )
}
