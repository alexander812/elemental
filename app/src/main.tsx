import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/inter'
import '@elemental/ui-kit/tokens.css'

import App from './App.tsx'
import { ThemeRoot } from './ThemeRoot.tsx'
import { $appReady } from './features/boot/store'
import { handleAndroidBack } from './features/navigation/store'
import {
  clearSession,
  consumePendingScan,
  installSessionPersistence,
  loadSession,
  restoreSession,
  saveSession,
} from './features/session/store'
import { installGhostClickSuppressor } from './lib/ghostClick'
import { callNativeSync } from './lib/nativeBridge'

import './index.css'

declare global {
  interface Window {
    __lexiBack?: () => boolean
  }
}

installGhostClickSuppressor()

window.__lexiBack = handleAndroidBack

const session = loadSession()
const sessionToken = callNativeSync<string>('sessionToken')

if (session && sessionToken && session.token === sessionToken) {
  restoreSession(session)
  saveSession()
} else {
  clearSession()
}

installSessionPersistence()
consumePendingScan()

const splash = document.getElementById('boot-splash')

const hideSplash = () => {
  if (!splash) return

  splash.classList.add('boot-splash_hidden')
  setTimeout(() => splash.remove(), 320)
}

if ($appReady.getState()) {
  hideSplash()
} else {
  $appReady.watch((ready) => {
    if (ready) hideSplash()
  })
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeRoot>
      <App />
    </ThemeRoot>
  </StrictMode>
)
