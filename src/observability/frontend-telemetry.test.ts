// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { recordFrontendApiError, startFrontendTelemetry } from './frontend-telemetry'
import { useTelemetryStatus } from './telemetry-status'

let stop: (() => void) | undefined

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  useTelemetryStatus.setState({ status: 'idle' })
  history.replaceState(null, '', '/?token=private-query#private-fragment')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202 })))
})

afterEach(() => {
  stop?.()
  stop = undefined
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.querySelector('meta[name="pantau-page-view"]')?.remove()
})

it('batches non-blocking keepalive fetch without credentials, raw errors, or URL secrets', async () => {
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(0)
  window.dispatchEvent(new ErrorEvent('error', { message: 'secret-password' }))
  recordFrontendApiError(500)
  expect(fetch).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1_000)
  expect(useTelemetryStatus.getState().status).toBe('accepted')
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

it('keeps a failed page view for retry with its original deduplication ID', async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(
      new Response(null, { status: 503, headers: { 'Retry-After': '30' } }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 202 }))
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(1_000)
  expect(fetch).toHaveBeenCalledTimes(1)
  const firstBody = vi.mocked(fetch).mock.calls[0][1]?.body
  expect(useTelemetryStatus.getState().status).toBe('retrying')
  await vi.advanceTimersByTimeAsync(29_999)
  expect(fetch).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(firstBody)
  expect(useTelemetryStatus.getState().status).toBe('accepted')
})

it('flushes short visits when the page hides before the first batch', async () => {
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(0)
  window.dispatchEvent(new Event('pagehide'))
  await vi.advanceTimersByTimeAsync(0)
  expect(fetch).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(20_000)
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('retries a network failure without leaking retry bookkeeping into the payload', async () => {
  vi.mocked(fetch)
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValueOnce(new Response(null, { status: 202 }))
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(31_001)
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(
    vi.mocked(fetch).mock.calls[0][1]?.body,
  )
  expect(String(vi.mocked(fetch).mock.calls[1][1]?.body)).not.toContain('attempts')
})

it('bounds retries during a prolonged outage', async () => {
  vi.mocked(fetch).mockImplementation(async () => new Response(null, { status: 503 }))
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(300_000)
  expect(fetch).toHaveBeenCalledTimes(3)
  expect(useTelemetryStatus.getState().status).toBe('unavailable')
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
  expect(useTelemetryStatus.getState().status).toBe('rejected')
})

it('keeps GPC and DNT visits observable without storing a session', async () => {
  for (const privacy of [{ doNotTrack: '1' }, { globalPrivacyControl: true }]) {
    vi.stubGlobal('navigator', privacy)
    const stopPrivacy = startFrontendTelemetry()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetch).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))
    expect(payload.events[0]).toMatchObject({
      session_id: '',
      referrer: '',
    })
    expect(sessionStorage.length).toBe(0)
    expect(useTelemetryStatus.getState().status).toBe('accepted')
    stopPrivacy()
    vi.mocked(fetch).mockClear()
  }
})

it('shares the server event ID so the fallback cannot double-count a page view', async () => {
  const meta = document.createElement('meta')
  meta.name = 'pantau-page-view'
  meta.content = '00000000-0000-4000-8000-000000000001'
  document.head.append(meta)
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(1000)
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).events[0].id).toBe(
    meta.content,
  )
})

it('does not drop mobile visits when randomUUID and timeout helpers are missing', async () => {
  vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
  vi.stubGlobal('AbortSignal', {})
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(1000)
  expect(fetch).toHaveBeenCalledOnce()
  expect(useTelemetryStatus.getState().status).toBe('accepted')
})

it('does not let an old client response overwrite the current privacy status', async () => {
  let accept: (response: Response) => void = () => {}
  vi.mocked(fetch).mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        accept = resolve
      }),
  )
  stop = startFrontendTelemetry()
  await vi.advanceTimersByTimeAsync(1_000)
  stop()
  vi.stubGlobal('navigator', { globalPrivacyControl: true })
  startFrontendTelemetry()()
  accept(new Response(null, { status: 202 }))
  await vi.advanceTimersByTimeAsync(0)
  expect(useTelemetryStatus.getState().status).toBe('privacy')
})
