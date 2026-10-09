import { createEvent, createStore } from 'effector'

export const showToast = createEvent<string>()
export const hideToast = createEvent()

export const $toast = createStore<string | null>(null)
  .on(showToast, (_, text) => text)
  .reset(hideToast)

let timer: number | undefined

showToast.watch((text) => {
  window.clearTimeout(timer)

  if (!text) return

  timer = window.setTimeout(() => hideToast(), 3000)
})
