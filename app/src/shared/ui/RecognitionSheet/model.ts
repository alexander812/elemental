import { createEffect, createEvent, createStore, sample } from 'effector'

import { isNativeBridgeAvailable } from '../../../lib/nativeBridge'
import type { AsrArtifact } from '../../../transport/recognition'
import { downloadAsr, fetchAsrArtifacts } from '../../../transport/recognition'

export const asrSheetOpened = createEvent()
export const asrSheetClosed = createEvent()
export const asrArtifactsReceived = createEvent<AsrArtifact[]>()

export const fetchAsrArtifactsFx = createEffect(() => fetchAsrArtifacts())
export const downloadAsrFx = createEffect((id: string) => downloadAsr(id))

const coversLanguage = (artifact: AsrArtifact, lang: string) => artifact.languages.includes(lang)

const artifactsForLanguage = (artifacts: AsrArtifact[], lang: string) =>
  artifacts
    .filter((artifact) => coversLanguage(artifact, lang))
    .sort((a, b) => a.languages.length - b.languages.length)

export const ensureAsrReadyFx = createEffect(async (lang: string) => {
  if (!isNativeBridgeAvailable()) return true

  try {
    const artifacts = await fetchAsrArtifacts()

    asrArtifactsReceived(artifacts)

    return artifacts.some((artifact) => artifact.installed && coversLanguage(artifact, lang))
  } catch {
    return true
  }
})

export const $asrSheetOpened = createStore(false)
  .on(asrSheetOpened, () => true)
  .on(asrSheetClosed, () => false)

export const $asrRequestedLanguage = createStore<string | null>(null).on(
  ensureAsrReadyFx,
  (_, lang) => lang
)

export const $asrArtifacts = createStore<AsrArtifact[]>([])
  .on(asrArtifactsReceived, (_, artifacts) => artifacts)
  .on(fetchAsrArtifactsFx.doneData, (_, artifacts) => artifacts)
  .on(downloadAsrFx, (artifacts, id) =>
    artifacts.map((artifact) =>
      artifact.id === id ? { ...artifact, downloading: true, error: null, progress: 0 } : artifact
    )
  )
  .on(downloadAsrFx.fail, (artifacts, { params, error }) =>
    artifacts.map((artifact) =>
      artifact.id === params ? { ...artifact, downloading: false, error: error.message } : artifact
    )
  )

export const $asrDownloading = $asrArtifacts.map((artifacts) =>
  artifacts.some((artifact) => artifact.downloading)
)

export const $asrProgress = $asrArtifacts.map((artifacts) => {
  const active = artifacts.find((artifact) => artifact.downloading)

  return active ? active.progress : null
})

export const $asrError = $asrArtifacts.map(
  (artifacts) => artifacts.find((artifact) => artifact.error)?.error ?? null
)

sample({
  clock: ensureAsrReadyFx.doneData,
  filter: (ready) => !ready,
  target: asrSheetOpened,
})

asrSheetOpened.watch(() => {
  const lang = $asrRequestedLanguage.getState() ?? ''
  const target = artifactsForLanguage($asrArtifacts.getState(), lang).find(
    (artifact) => !artifact.installed && !artifact.downloading
  )

  if (target) {
    downloadAsrFx(target.id).catch(() => undefined)
  }
})

sample({ clock: downloadAsrFx.done, target: fetchAsrArtifactsFx })

sample({
  clock: $asrArtifacts.updates,
  source: $asrRequestedLanguage,
  filter: (lang, artifacts) =>
    lang !== null && artifacts.some((artifact) => artifact.installed && coversLanguage(artifact, lang)),
  target: asrSheetClosed,
})

let timer: number | undefined

const stopPolling = () => {
  if (timer === undefined) return

  window.clearInterval(timer)
  timer = undefined
}

const startPolling = () => {
  if (timer !== undefined) return

  timer = window.setInterval(() => {
    fetchAsrArtifactsFx().catch(() => undefined)
  }, 1000)
}

$asrDownloading.updates.watch((downloading) => {
  if (downloading) startPolling()
  else stopPolling()
})
