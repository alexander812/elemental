import { createEvent, createStore } from 'effector'
import type { MessageDescriptor } from 'react-intl'

export const showToast = createEvent<MessageDescriptor>()
export const hideToast = createEvent()

export const $toast = createStore<MessageDescriptor | null>(null)
  .on(showToast, (_, text) => text)
  .reset(hideToast)

let timer: number | undefined

showToast.watch((text) => {
  window.clearTimeout(timer)

  if (!text) return

  timer = window.setTimeout(() => hideToast(), 3000)
})
