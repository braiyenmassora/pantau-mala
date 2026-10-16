import { create } from 'zustand'

export const useAppUpdate = create(() => ({ available: false, applying: false }))

let waitingRegistration: ServiceWorkerRegistration | undefined
let reloadRequested = false

export function applyAppUpdate() {
  if (useAppUpdate.getState().applying) return
  useAppUpdate.setState({ applying: true })
  const worker = waitingRegistration?.waiting
  if (worker) {
    reloadRequested = true
    worker.postMessage({ type: 'SKIP_WAITING' })
  } else {
    window.location.reload()
  }
}

export async function registerAppWorker() {
  try {
    const hadController = Boolean(navigator.serviceWorker.controller)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadRequested) window.location.reload()
      else if (hadController) useAppUpdate.setState({ available: true })
    })
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    waitingRegistration = registration
    const checkWaiting = () => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        useAppUpdate.setState({ available: true })
      }
    }
    checkWaiting()
    registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', checkWaiting)
    })
    let checkedAt = Date.now()
    const checkUpdate = () => {
      if (document.hidden || Date.now() - checkedAt < 60_000) return
      checkedAt = Date.now()
      void registration.update().catch(() => {})
    }
    window.addEventListener('focus', checkUpdate)
    document.addEventListener('visibilitychange', checkUpdate)
    await registration.update()
  } catch {
    return
  }
}
