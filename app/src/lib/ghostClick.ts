let suppressUntil = 0
let installed = false

const resetSuppression = () => {
  suppressUntil = 0
}

const swallowCompatibilityEvent = (event: MouseEvent) => {
  if (performance.now() >= suppressUntil) return

  event.stopPropagation()
  event.preventDefault()
}

export const suppressNextGhostClick = () => {
  suppressUntil = performance.now() + 1000
}

export const installGhostClickSuppressor = () => {
  if (installed) return

  installed = true

  window.addEventListener('pointerdown', resetSuppression, true)
  window.addEventListener('mousedown', swallowCompatibilityEvent, true)
  window.addEventListener('mouseup', swallowCompatibilityEvent, true)
  window.addEventListener('click', swallowCompatibilityEvent, true)
}
