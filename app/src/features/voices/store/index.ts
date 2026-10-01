import { createEffect, createEvent, createStore, sample } from 'effector';

import { isNativeBridgeAvailable } from '../../../lib/nativeBridge';
import { deleteVoice, downloadVoice, fetchVoices } from '../../../transport/voices';
import type { VoiceStatus } from '../../../transport/voices';

export const voicesRequested = createEvent();

export const fetchVoicesFx = createEffect(() => fetchVoices());
export const downloadVoiceFx = createEffect((lang: string) => downloadVoice(lang));
export const deleteVoiceFx = createEffect((lang: string) => deleteVoice(lang));

export const $voiceManagerAvailable = createStore(isNativeBridgeAvailable());

export const $voices = createStore<VoiceStatus[]>([])
  .on(fetchVoicesFx.doneData, (_, voices) => voices)
  .on(downloadVoiceFx, (voices, lang) =>
    voices.map((voice) => (voice.lang === lang ? { ...voice, downloading: true, error: null } : voice)),
  )
  .on(downloadVoiceFx.failData, (voices, error) =>
    voices.map((voice) => (voice.downloading ? { ...voice, downloading: false, error: error.message } : voice)),
  )
  .on(downloadVoiceFx.done, (voices, { params }) =>
    voices.map((voice) => (voice.lang === params ? { ...voice, downloading: false } : voice)),
  );

export const $voicesLoading = fetchVoicesFx.pending;

export const $voicesDownloading = $voices.map((voices) => voices.some((voice) => voice.downloading));

sample({ clock: voicesRequested, target: fetchVoicesFx });
sample({ clock: downloadVoiceFx.doneData, target: fetchVoicesFx });
sample({ clock: deleteVoiceFx.doneData, target: fetchVoicesFx });
