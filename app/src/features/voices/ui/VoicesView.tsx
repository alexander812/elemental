import { useEffect, useState } from 'react'

import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'
import type { IntlShape, MessageDescriptor } from 'react-intl'

import { Box, Button, Card, FormHelperText, Header, Stack, Text } from '@elemental/ui-kit'

import { getLanguageName } from '../../../lib/languages'
import type { VoiceStatus } from '../../../transport/voices'
import { $languages } from '../../languages/store'
import { popScreen } from '../../navigation/store'
import {
  deleteVoiceFx,
  downloadVoiceFx,
  fetchVoicesFx,
  voicesRequested,
  $voiceManagerAvailable,
  $voices,
  $voicesDownloading,
} from '../store'

const formatSize = (intl: IntlShape, sizeBytes: number) =>
  intl.formatMessage(
    { id: 'voices_size_mb', defaultMessage: '{size} MB' },
    { size: Math.round(sizeBytes / 1024 / 1024) }
  )

const VOICE_ERRORS: Record<string, MessageDescriptor> = {
  voice_incomplete: {
    id: 'voices_error_incomplete',
    defaultMessage: "The download didn't finish, try again",
  },
  storage_unavailable: {
    id: 'voices_error_storage',
    defaultMessage: 'Not enough storage on the device',
  },
  asset_extract_failed: {
    id: 'voices_error_engine',
    defaultMessage: "Couldn't install the voice engine",
  },
}

const VOICE_ERROR_FALLBACK: MessageDescriptor = {
  id: 'voices_download_error',
  defaultMessage: 'Failed to download the voice: {error}',
}

export function VoicesView() {
  const intl = useIntl()
  const languages = useUnit($languages)
  const voices = useUnit($voices)
  const available = useUnit($voiceManagerAvailable)
  const downloading = useUnit($voicesDownloading)

  const [deletingLang, setDeletingLang] = useState<string | null>(null)

  useEffect(() => {
    if (available) voicesRequested()
  }, [available])

  useEffect(() => {
    if (!downloading) return

    const timer = setInterval(() => fetchVoicesFx(), 1000)

    return () => clearInterval(timer)
  }, [downloading])

  const handleDelete = (lang: string) => {
    setDeletingLang(lang)
    deleteVoiceFx(lang)
      .catch(() => undefined)
      .finally(() => setDeletingLang(null))
  }

  const renderVoice = (voice: VoiceStatus) => {
    const deleting = deletingLang === voice.lang

    return (
      <Card key={voice.lang} padding="l">
        <Stack direction="row" horizontalAlign="space-between" spacing="m" verticalAlign="center">
          <Stack spacing="xs">
            <Text variant="M / Medium">{getLanguageName(voice.lang, languages)}</Text>
            <Text color="contrast-tertiary" variant="XS / Medium">
              {voice.title} · {formatSize(intl, voice.sizeBytes)}
            </Text>
          </Stack>
          {voice.installed ? (
            <Button
              color="negative"
              loading={deleting}
              variant="secondary"
              onClick={() => handleDelete(voice.lang)}
            >
              <FormattedMessage id="common_delete" defaultMessage="Delete" />
            </Button>
          ) : (
            <Button
              disabled={voice.downloading}
              loading={voice.downloading}
              variant="secondary"
              onClick={() => downloadVoiceFx(voice.lang)}
            >
              {voice.downloading ? (
                `${Math.round(voice.progress * 100)}%`
              ) : (
                <FormattedMessage id="voices_download" defaultMessage="Download" />
              )}
            </Button>
          )}
        </Stack>
        {voice.error ? (
          <FormHelperText variant="error">
            <FormattedMessage
              {...(VOICE_ERRORS[voice.error] ?? VOICE_ERROR_FALLBACK)}
              values={{ error: voice.error }}
            />
          </FormHelperText>
        ) : null}
      </Card>
    )
  }

  return (
    <Box grow height="100%">
      <Header
        back
        text={<FormattedMessage id="voices_title" defaultMessage="Voiceover" />}
        onBackClick={() => popScreen()}
      />
      <Box grow padding="m">
        <Stack spacing="m">
          <Text color="contrast-secondary" variant="S / Medium">
            <FormattedMessage
              id="voices_description"
              defaultMessage="Neural voices work offline: download a voice once and the voiceover will work without the internet."
            />
          </Text>
          {voices.map(renderVoice)}
          {!available ? (
            <FormHelperText variant="error">
              <FormattedMessage
                id="voices_android_only"
                defaultMessage="Available only in the Android app"
              />
            </FormHelperText>
          ) : null}
        </Stack>
      </Box>
    </Box>
  )
}
