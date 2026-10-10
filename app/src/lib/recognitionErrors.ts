const RECOGNIZE_ERRORS: Record<string, string> = {
  'audio-capture': 'Микрофон недоступен',
  'no-speech': 'Ничего не расслышали, попробуйте ещё',
  'not-allowed': 'Разрешите доступ к микрофону',
  'service-not-allowed': 'Распознавание речи недоступно',
  asr_download_failed: 'Не удалось скачать распознавание речи',
  audio_error: 'Микрофон недоступен',
  audio_unavailable: 'Микрофон недоступен',
  busy: 'Подождите, распознавание уже идёт',
  language_not_supported: 'Для этого языка офлайн-распознавание недоступно',
  network: 'Нет соединения для распознавания',
  no_speech: 'Ничего не расслышали, попробуйте ещё',
  not_available: 'Распознавание речи недоступно на устройстве',
  permission_denied: 'Разрешите доступ к микрофону',
  recognition_unavailable: 'Распознавание речи недоступно',
  timeout: 'Не удалось расслышать фразу',
  unknown_method: 'Обновите приложение',
}

export const recognizeErrorText = (error: Error) =>
  RECOGNIZE_ERRORS[error.message] ?? 'Не удалось распознать речь'
