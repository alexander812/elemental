import type { MessageDescriptor } from 'react-intl'

const RECOGNIZE_ERRORS: Record<string, MessageDescriptor> = {
  'audio-capture': {
    id: 'errors_microphone_unavailable',
    defaultMessage: 'Microphone unavailable',
  },
  'no-speech': {
    id: 'errors_recognition_no_speech',
    defaultMessage: "We didn't catch that, try again",
  },
  'not-allowed': {
    id: 'errors_microphone_access',
    defaultMessage: 'Allow microphone access',
  },
  'service-not-allowed': {
    id: 'errors_recognition_unavailable',
    defaultMessage: 'Speech recognition unavailable',
  },
  asr_download_failed: {
    id: 'errors_asr_download_failed',
    defaultMessage: 'Failed to download speech recognition',
  },
  audio_error: {
    id: 'errors_microphone_unavailable',
    defaultMessage: 'Microphone unavailable',
  },
  audio_unavailable: {
    id: 'errors_microphone_unavailable',
    defaultMessage: 'Microphone unavailable',
  },
  busy: {
    id: 'errors_recognition_busy',
    defaultMessage: 'Please wait, recognition is already running',
  },
  language_not_supported: {
    id: 'errors_recognition_language_not_supported',
    defaultMessage: 'Offline recognition is unavailable for this language',
  },
  network: {
    id: 'errors_recognition_network',
    defaultMessage: 'No connection for recognition',
  },
  no_speech: {
    id: 'errors_recognition_no_speech',
    defaultMessage: "We didn't catch that, try again",
  },
  not_available: {
    id: 'errors_recognition_not_available',
    defaultMessage: 'Speech recognition is unavailable on this device',
  },
  permission_denied: {
    id: 'errors_microphone_access',
    defaultMessage: 'Allow microphone access',
  },
  recognition_unavailable: {
    id: 'errors_recognition_unavailable',
    defaultMessage: 'Speech recognition unavailable',
  },
  timeout: {
    id: 'errors_recognition_timeout',
    defaultMessage: "Couldn't make out the phrase",
  },
  unknown_method: {
    id: 'errors_update_app',
    defaultMessage: 'Update the app',
  },
}

const ASR_ARTIFACT_ERRORS: Record<string, MessageDescriptor> = {
  asr_download_failed: {
    id: 'errors_asr_download_failed',
    defaultMessage: 'Failed to download speech recognition',
  },
  asr_incomplete: {
    id: 'errors_asr_incomplete',
    defaultMessage: "The download didn't finish, try again",
  },
  storage_unavailable: {
    id: 'errors_storage_unavailable',
    defaultMessage: 'Not enough storage on the device',
  },
}

const RECOGNIZE_FAILED: MessageDescriptor = {
  id: 'errors_recognition_failed',
  defaultMessage: "Couldn't recognize speech",
}

export const recognizeErrorDescriptor = (error: Error): MessageDescriptor =>
  RECOGNIZE_ERRORS[error.message] ?? RECOGNIZE_FAILED

const SILENT_RECOGNIZE_ERRORS = new Set(['no-speech', 'no_speech', 'timeout'])

export const isSilentRecognitionError = (error: unknown) =>
  error instanceof Error && SILENT_RECOGNIZE_ERRORS.has(error.message)

export const asrArtifactErrorDescriptor = (error: string): MessageDescriptor =>
  ASR_ARTIFACT_ERRORS[error] ?? recognizeErrorDescriptor(new Error(error))
