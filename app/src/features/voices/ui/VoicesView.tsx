import { useEffect, useState } from 'react';

import { useUnit } from 'effector-react';

import { Box, Button, Card, FormHelperText, Header, Stack, Text } from '@elemental/ui-kit';

import { getLanguageName } from '../../../lib/languages';
import type { VoiceStatus } from '../../../transport/voices';
import { $languages } from '../../languages/store';
import { popScreen } from '../../navigation/store';
import {
  deleteVoiceFx,
  downloadVoiceFx,
  fetchVoicesFx,
  voicesRequested,
  $voiceManagerAvailable,
  $voices,
  $voicesDownloading,
} from '../store';

const formatSize = (sizeBytes: number) => `${Math.round(sizeBytes / 1024 / 1024)} МБ`;

const VOICE_ERRORS: Record<string, string> = {
  download_failed: 'Не удалось скачать голос',
  download_incomplete: 'Загрузка прервалась, попробуйте ещё раз',
  storage_unavailable: 'Недостаточно места на устройстве',
  extract_failed: 'Не удалось распаковать голос',
};

export function VoicesView() {
  const languages = useUnit($languages);
  const voices = useUnit($voices);
  const available = useUnit($voiceManagerAvailable);
  const downloading = useUnit($voicesDownloading);

  const [deletingLang, setDeletingLang] = useState<string | null>(null);

  useEffect(() => {
    if (available) voicesRequested();
  }, [available]);

  useEffect(() => {
    if (!downloading) return;

    const timer = setInterval(() => fetchVoicesFx(), 1000);

    return () => clearInterval(timer);
  }, [downloading]);

  const handleDelete = (lang: string) => {
    setDeletingLang(lang);
    deleteVoiceFx(lang)
      .catch(() => undefined)
      .finally(() => setDeletingLang(null));
  };

  const renderVoice = (voice: VoiceStatus) => {
    const deleting = deletingLang === voice.lang;

    return (
      <Card key={voice.lang} padding="l">
        <Stack direction="row" horizontalAlign="space-between" spacing="m" verticalAlign="center">
          <Stack spacing="xs">
            <Text variant="M / Medium">{getLanguageName(voice.lang, languages)}</Text>
            <Text color="contrast-tertiary" variant="XS / Medium">
              {voice.title} · {formatSize(voice.sizeBytes)}
            </Text>
          </Stack>
          {voice.installed ? (
            <Button
              color="negative"
              loading={deleting}
              variant="secondary"
              onClick={() => handleDelete(voice.lang)}
            >
              Удалить
            </Button>
          ) : (
            <Button
              disabled={voice.downloading}
              loading={voice.downloading}
              variant="secondary"
              onClick={() => downloadVoiceFx(voice.lang)}
            >
              {voice.downloading ? `${Math.round(voice.progress * 100)}%` : 'Скачать'}
            </Button>
          )}
        </Stack>
        {voice.error ? (
          <FormHelperText variant="error">
            {VOICE_ERRORS[voice.error] ?? 'Не удалось скачать голос'}
          </FormHelperText>
        ) : null}
      </Card>
    );
  };

  return (
    <Box grow height="100%">
      <Header back text="Озвучка" onBackClick={() => popScreen()} />
      <Box grow padding="m">
        <Stack spacing="m">
          <Text color="contrast-secondary" variant="S / Medium">
            Нейроголоса работают офлайн: скачайте голос один раз, и озвучка будет без интернета.
          </Text>
          {voices.map(renderVoice)}
          {!available ? (
            <FormHelperText variant="error">Доступно только в Android-приложении</FormHelperText>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
