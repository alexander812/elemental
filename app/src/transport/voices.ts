import { callNative } from '../lib/nativeBridge'

export type VoiceStatus = {
  lang: string
  id: string
  title: string
  sizeBytes: number
  installed: boolean
  downloading: boolean
  progress: number
  error: string | null
}

export function fetchVoices(): Promise<VoiceStatus[]> {
  return callNative<{ voices: VoiceStatus[] }>('ttsVoices').then((result) => result.voices)
}

export function downloadVoice(lang: string): Promise<void> {
  return callNative('downloadVoice', { lang }).then(() => undefined)
}

export function deleteVoice(lang: string): Promise<void> {
  return callNative('deleteVoice', { lang }).then(() => undefined)
}
