export function timeoutSignal(milliseconds: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(milliseconds)
  const controller = new AbortController()
  window.setTimeout(() => controller.abort(), milliseconds)
  return controller.signal
}

export function requestSignal(signal: AbortSignal | undefined, milliseconds: number) {
  const timeout = timeoutSignal(milliseconds)
  if (!signal) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout])
  const controller = new AbortController()
  const abort = () => {
    signal.removeEventListener('abort', abort)
    timeout.removeEventListener('abort', abort)
    controller.abort()
  }
  if (signal.aborted || timeout.aborted) {
    abort()
    return controller.signal
  }
  signal.addEventListener('abort', abort, { once: true })
  timeout.addEventListener('abort', abort, { once: true })
  return controller.signal
}
