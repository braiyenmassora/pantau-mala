// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { recordFrontendApiError, startFrontendTelemetry } from './frontend-telemetry'

let stop: (() => void) | undefined

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  history.replaceState(null, '', '/?token=private-query#private-fragment')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202 })))
})

afterEach(() => {
  stop?.()
  stop = undefined
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('batches non-blocking keepalive fetch without credentials, raw errors, or URL secrets', async () => {
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(0)
  window.dispatchEvent(new ErrorEvent('error', { message: 'secret-password' }))
  recordFrontendApiError(500)
  expect(fetch).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(10_000)
  expect(fetch).toHaveBeenCalledTimes(1)
  const [path, options] = vi.mocked(fetch).mock.calls[0]
  expect(path).toBe('/api/v1/telemetry')
  expect(options).toMatchObject({ method: 'POST', keepalive: true, mode: 'same-origin' })
  expect(options?.headers).toMatchObject({
    Prefer: 'respond-async',
    'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
  })
  const payload = JSON.parse(String(options?.body))
  expect(payload.events).toHaveLength(3)
  expect(payload.events[0]).toMatchObject({ type: 'page_view', path: '/' })
  expect(payload.events[1].issue).toBe('runtime_error')
  expect(payload.events[2]).toMatchObject({ issue: 'api_error', status: 500 })
  expect(String(options?.body)).not.toMatch(
    /private-query|private-fragment|secret-password|client_id|Authorization/,
  )
})

it('caps a burst at 40 buffered events and 20 per batch', async () => {
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(0)
  for (let index = 0; index < 500; index++) recordFrontendApiError(500)
  await vi.advanceTimersByTimeAsync(20_000)
  expect(fetch).toHaveBeenCalledTimes(2)
  for (const [, options] of vi.mocked(fetch).mock.calls) {
    expect(JSON.parse(String(options?.body)).events).toHaveLength(20)
    expect(new TextEncoder().encode(String(options?.body)).byteLength).toBeLessThan(
      16 * 1024,
    )
  }
})

it('does not double-count the React StrictMode setup/cleanup cycle', async () => {
  startFrontendTelemetry()()
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(10_001)
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).events).toHaveLength(
    1,
  )
})

it('stops after an unsupported endpoint instead of causing repeated errors', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }))
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(10_001)
  recordFrontendApiError(500)
  await vi.advanceTimersByTimeAsync(60_000)
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('respects GPC and DNT without sending or storing a session', async () => {
  for (const privacy of [{ doNotTrack: '1' }, { globalPrivacyControl: true }]) {
    vi.stubGlobal('navigator', privacy)
    startFrontendTelemetry()()
  }
  await vi.advanceTimersByTimeAsync(20_000)
  expect(fetch).not.toHaveBeenCalled()
  expect(sessionStorage.length).toBe(0)
})
