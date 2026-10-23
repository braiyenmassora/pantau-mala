/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isPrivacyMode,
  pageViewEventId,
  resetTelemetryForTests,
  sendTelemetry,
  startTelemetry,
  telemetryPath,
  telemetrySessionId,
  telemetrySumber,
  TELEMETRY_SESSION_KEY,
  getTelemetryStatus,
} from './telemetry'

describe('telemetry', () => {
  beforeEach(() => {
    resetTelemetryForTests()
    sessionStorage.clear()
    document.head.innerHTML = ''
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    resetTelemetryForTests()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('detects DNT/GPC as privacy mode without aborting', () => {
    expect(isPrivacyMode({ doNotTrack: '1' } as Navigator)).toBe(true)
    expect(
      isPrivacyMode({
        doNotTrack: '0',
        globalPrivacyControl: true,
      } as Navigator & { globalPrivacyControl: boolean }),
    ).toBe(true)
    expect(isPrivacyMode({ doNotTrack: '0' } as Navigator)).toBe(false)
  })

  it('strips query and fragment from path', () => {
    expect(
      telemetryPath({
        pathname: '/dashboard',
        search: '?x=1',
        hash: '#y',
      } as Location),
    ).toBe('/dashboard')
  })

  it('extracts sumber fields from query without keeping raw search', () => {
    expect(
      telemetrySumber({
        search: '?utm_source=google&utm_medium=organic&utm_campaign=karhutla&x=1',
      } as Location),
    ).toEqual({
      utm_source: 'google',
      utm_medium: 'organic',
      utm_campaign: 'karhutla',
    })
    expect(telemetrySumber({ search: '' } as Location)).toEqual({})
    expect(
      telemetrySumber({
        search: `?utm_source=${'a'.repeat(65)}`,
      } as Location),
    ).toEqual({})
  })

  it('reuses pantau-page-view meta for first page_view id', () => {
    const meta = document.createElement('meta')
    meta.name = 'pantau-page-view'
    meta.content = '00000000-0000-4000-8000-000000000010'
    document.head.appendChild(meta)
    expect(pageViewEventId()).toBe('00000000-0000-4000-8000-000000000010')
  })

  it('privacy mode skips sessionStorage and returns empty session id', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    expect(telemetrySessionId(true)).toBe('')
    expect(getItem).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
  })

  it('normal mode stores random session id in sessionStorage', () => {
    const a = telemetrySessionId(false)
    const b = telemetrySessionId(false)
    expect(a).toMatch(/^[0-9a-f-]{36}$/i)
    expect(b).toBe(a)
    expect(sessionStorage.getItem(TELEMETRY_SESSION_KEY)).toContain(a)
  })

  it('sends async headers, keepalive, and empty session/referrer in privacy mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('navigator', {
      doNotTrack: '1',
      globalPrivacyControl: false,
    })

    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'https://example.com/from',
    })

    startTelemetry()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/telemetry')
    expect(init.method).toBe('POST')
    expect(init.keepalive).toBe(true)
    expect(init.credentials).toBe('same-origin')
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers.Prefer).toBe('respond-async')
    expect(headers['X-Pantau-Telemetry-Transport']).toBe('fetch-keepalive')
    const body = JSON.parse(String(init.body)) as {
      events: Array<{
        session_id: string
        referrer: string
        type: string
        utm_source?: string
        utm_medium?: string
        utm_campaign?: string
      }>
    }
    expect(body.events[0].type).toBe('page_view')
    expect(body.events[0].session_id).toBe('')
    expect(body.events[0].referrer).toBe('')
    expect(body.events[0].utm_source).toBeUndefined()
    expect(body.events[0].utm_medium).toBeUndefined()
    expect(body.events[0].utm_campaign).toBeUndefined()
    expect(getTelemetryStatus()).toBe('privacy')
    expect(sessionStorage.length).toBe(0)
  })

  it('includes sumber fields on page_view in normal mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('navigator', {
      doNotTrack: '0',
      globalPrivacyControl: false,
    })
    window.history.replaceState(
      {},
      '',
      '/?utm_source=google&utm_medium=organic&utm_campaign=karhutla',
    )

    startTelemetry()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body)) as {
      events: Array<{
        utm_source?: string
        utm_medium?: string
        utm_campaign?: string
        path: string
      }>
    }
    expect(body.events[0].path).toBe('/')
    expect(body.events[0].utm_source).toBe('google')
    expect(body.events[0].utm_medium).toBe('organic')
    expect(body.events[0].utm_campaign).toBe('karhutla')
  })

  it('sends page_view on SPA path change without repeating UTM/referrer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('navigator', {
      doNotTrack: '0',
      globalPrivacyControl: false,
    })
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'https://www.google.com/',
    })
    window.history.replaceState({}, '', '/?utm_source=google')

    startTelemetry()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    window.history.pushState({}, '', '/wilayah/kab-contoh-1234')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const second = JSON.parse(String(fetchMock.mock.calls[1][1].body)) as {
      events: Array<{
        path: string
        referrer: string
        utm_source?: string
      }>
    }
    expect(second.events[0].path).toBe('/wilayah/kab-contoh-1234')
    expect(second.events[0].referrer).toBe('')
    expect(second.events[0].utm_source).toBeUndefined()

    // replaceState slug sama path → tidak kirim ulang
    window.history.replaceState({}, '', '/wilayah/kab-contoh-1234')
    await new Promise((r) => setTimeout(r, 30))
    expect(fetchMock).toHaveBeenCalledTimes(2)

    window.history.pushState({}, '', '/')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    const third = JSON.parse(String(fetchMock.mock.calls[2][1].body)) as {
      events: Array<{ path: string }>
    }
    expect(third.events[0].path).toBe('/')
  })

  it('treats HTTP 202 as accepted for normal mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    await sendTelemetry(
      [
        {
          id: '00000000-0000-4000-8000-000000000010',
          session_id: '00000000-0000-4000-8000-000000000020',
          type: 'page_view',
          path: '/',
          referrer: '',
        },
      ],
      false,
    )
    expect(getTelemetryStatus()).toBe('accepted')
  })

  it('does not throw when telemetry fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(
      sendTelemetry(
        [
          {
            id: crypto.randomUUID(),
            session_id: '',
            type: 'page_view',
            path: '/',
            referrer: '',
          },
        ],
        false,
      ),
    ).resolves.toBeUndefined()
    expect(getTelemetryStatus()).toBe('unavailable')
  })
})
