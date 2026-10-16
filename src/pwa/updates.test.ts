// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

async function registrationFixture(hasController = true) {
  const installing = new EventTarget()
  const registration = Object.assign(new EventTarget(), {
    waiting: null as { postMessage: ReturnType<typeof vi.fn> } | null,
    installing,
    update: vi.fn().mockResolvedValue(undefined),
  })
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: hasController ? {} : null,
    register: vi.fn().mockResolvedValue(registration),
  })
  const browserWindow = Object.assign(new EventTarget(), { location: { reload: vi.fn() } })
  vi.stubGlobal('navigator', { serviceWorker })
  vi.stubGlobal('window', browserWindow)
  const updates = await import('./updates')
  return { registration, serviceWorker, browserWindow, ...updates }
}

it('announces an installed update but reloads only after explicit confirmation', async () => {
  const fixture = await registrationFixture()
  await fixture.registerAppWorker()
  fixture.registration.dispatchEvent(new Event('updatefound'))
  const postMessage = vi.fn()
  fixture.registration.waiting = { postMessage }
  fixture.registration.installing.dispatchEvent(new Event('statechange'))
  expect(fixture.useAppUpdate.getState().available).toBe(true)
  expect(fixture.browserWindow.location.reload).not.toHaveBeenCalled()
  fixture.applyAppUpdate()
  expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  expect(fixture.browserWindow.location.reload).not.toHaveBeenCalled()
  fixture.serviceWorker.dispatchEvent(new Event('controllerchange'))
  expect(fixture.browserWindow.location.reload).toHaveBeenCalledTimes(1)
})

it('does not request an update on first install or interrupt a new visitor', async () => {
  const fixture = await registrationFixture(false)
  fixture.registration.waiting = { postMessage: vi.fn() }
  await fixture.registerAppWorker()
  fixture.serviceWorker.dispatchEvent(new Event('controllerchange'))
  expect(fixture.useAppUpdate.getState().available).toBe(false)
  expect(fixture.browserWindow.location.reload).not.toHaveBeenCalled()
  expect(fixture.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' })
})

it('keeps the application usable when service worker registration fails', async () => {
  const fixture = await registrationFixture()
  fixture.serviceWorker.register.mockRejectedValue(new Error('unavailable'))
  await expect(fixture.registerAppWorker()).resolves.toBeUndefined()
  expect(fixture.useAppUpdate.getState().available).toBe(false)
})
