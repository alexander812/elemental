/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_KEY?: string
  readonly VITE_POSTHOG_HOST?: string
}

declare const __APP_VERSION__: string
declare const __BUILD_DATE__: string

declare module '*.module.pcss' {
  const classes: { readonly [key: string]: string }
  export default classes
}
