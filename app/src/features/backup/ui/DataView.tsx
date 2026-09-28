import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { useUnit } from 'effector-react';

import { IconDownload, IconRestore, IconUpload } from '@elemental/icons';
import {
  Box,
  Button,
  Card,
  FormHelperText,
  Header,
  ListItem,
  Stack,
  Text,
} from '@elemental/ui-kit';

import { parseBackup } from '../../../transport/backup';
import type { BackupData } from '../../../transport/backup';
import { goToRoot, popScreen } from '../../navigation/store';
import { exportBackupFx, importBackupFx } from '../store';

export function DataView() {
  const exporting = useUnit(exportBackupFx.pending);
  const importing = useUnit(importBackupFx.pending);

  const inputRef = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<BackupData | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cardCount = backup?.sets.reduce((acc, set) => acc + set.cards.length, 0) ?? 0;

  const handleExport = () => {
    setError(null);
    exportBackupFx().catch(() => setError('Не удалось сохранить файл'));
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    try {
      const raw = await file.text();
      setBackup(parseBackup(raw));
      setFileName(file.name);
      setError(null);
    } catch {
      setBackup(null);
      setFileName('');
      setError('Не удалось прочитать файл');
    }
  };

  const handleImport = async () => {
    if (!backup) return;

    try {
      await importBackupFx(backup);
      goToRoot();
    } catch {
      setError('Не удалось импортировать данные');
    }
  };

  return (
    <Box grow height="100%">
      <Header back text="Данные" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="m">
          <Card padding="0">
            <ListItem
              data={{ action: 'export' }}
              disabled={exporting}
              onClick={handleExport}
            >
              <ListItem.StartBlock
                icon={<IconDownload color="var(--accent-text-and-icons)" fontSize={24} />}
                subtitle={
                  <Text color="contrast-secondary" variant="XS / Medium">
                    Наборы, карточки, языки и настройки
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
                    Заменить текущие данные из файла
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
                      {backup.sets.length} наборов · {cardCount} карточек · {backup.languages.length} языков
                    </Text>
                  </Stack>
                </Stack>
                <FormHelperText variant="warning">
                  Текущие данные будут заменены без возможности отмены
                </FormHelperText>
                <Button
                  color="negative"
                  fullWidth
                  loading={importing}
                  onClick={handleImport}
                >
                  Импортировать
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
    </Box>
  );
}
