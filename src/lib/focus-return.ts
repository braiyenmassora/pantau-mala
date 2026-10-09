/** Last interactive element that opened detail / dialog — restored on Esc close. */
let lastTrigger: HTMLElement | null = null

export function rememberFocusTrigger(el: EventTarget | null) {
  if (el instanceof HTMLElement) lastTrigger = el
}

export function restoreFocusTrigger() {
  const el = lastTrigger
  lastTrigger = null
  el?.focus()
}
