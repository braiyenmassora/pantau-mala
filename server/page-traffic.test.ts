import { afterEach, expect, it, vi } from 'vitest'
import { preparePageTraffic, deliverPageTraffic } from './page-traffic'
import { handleRequest } from '../worker'
import { createClientGateway } from './client-gateway.mjs'

const html = () =>
  new Response('<!doctype html><html><head></head><body>Map</body></html>', {
    headers: { 'Content-Type': 'text/html', ETag: 'static-shell' },
  })
const navigation = (headers: Record<string, string> = {}) =>
  new Request('https://fixture.test/?token=secret-query#secret-fragment', {
    headers: { Accept: 'text/html', 'Sec-Fetch-Dest': 'document', ...headers },
  })

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('measures a real document without cookies, IPs, session IDs, or URL secrets', async () => {
  const page = (await preparePageTraffic(
    navigation({ Referer: 'https://other.test/path?secret' }),
    html(),
  ))!
  expect(await page.response.text()).toContain(
    `name="pantau-page-view" content="${page.id}"`,
  )
  expect(page.response.headers.get('Cache-Control')).toBe('no-store')
  expect(page.response.headers.has('ETag')).toBe(false)
  expect(page.response.headers.has('Set-Cookie')).toBe(false)
  expect(JSON.parse(page.body).events[0]).toMatchObject({
    id: page.id,
    session_id: '',
    path: '/',
    referrer: 'https://other.test',
  })
  expect(page.body).not.toMatch(/secret|token|fragment/)
})

it.each(['DNT', 'Sec-GPC'])(
  'keeps %s aggregate counts without creating a visitor identity',
  async (name) => {
    const page = (await preparePageTraffic(navigation({ [name]: '1' }), html()))!
    expect(JSON.parse(page.body).events[0].session_id).toBe('')
    expect(page.response.headers.has('Set-Cookie')).toBe(false)
  },
)

it.each([
  { Purpose: 'prefetch' },
  { 'Sec-Purpose': 'prefetch;prerender' },
  { 'Sec-Fetch-Dest': 'image' },
  { 'User-Agent': 'Googlebot/1.0' },
  { Accept: 'application/json' },
])('ignores assets, bots and speculative loads: %j', async (headers) => {
  expect(
    await preparePageTraffic(navigation(headers as Record<string, string>), html()),
  ).toBeNull()
})

it('does not count HEAD, unsuccessful responses, or non-HTML assets', async () => {
  expect(
    await preparePageTraffic(
      new Request('https://fixture.test', {
        method: 'HEAD',
        headers: { Accept: 'text/html' },
      }),
      html(),
    ),
  ).toBeNull()
  expect(
    await preparePageTraffic(navigation(), new Response('unavailable', { status: 503 })),
  ).toBeNull()
  expect(await preparePageTraffic(navigation(), new Response('script'))).toBeNull()
})

it('retries the same event identity rather than producing extra page views', async () => {
  vi.useFakeTimers()
  const page = (await preparePageTraffic(navigation(), html()))!
  const gateway = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 202 }))
  const result = deliverPageTraffic(page, gateway, { runtime: 'cloudflare' })
  await vi.advanceTimersByTimeAsync(1000)
  await result
  expect(gateway).toHaveBeenCalledTimes(2)
  for (const [request, metadata] of gateway.mock.calls) {
    expect(await request.text()).toBe(page.body)
    expect(metadata).toMatchObject({ viewSource: 'edge', timeoutMs: 3500 })
  }
})

it('returns the document while ingestion is pending, even with DNT and no browser script', async () => {
  const env = {
    ASSETS: { fetch: vi.fn().mockResolvedValue(html()) },
    FE_ACCESS_MODE: 'client',
    PANTAU_API_ORIGIN: 'https://api.test',
    PANTAU_CLIENT_SLUG: 'fixture',
    PANTAU_API_KEY: 'private-key',
  }
  const tasks: Promise<unknown>[] = []
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        data: { kind: 'key', scope: 'data:read', client_slug: 'fixture' },
      }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 202 }))
  const response = await handleRequest(navigation({ DNT: '1' }), env, fetcher, {
    waitUntil: (task) => {
      tasks.push(task)
    },
  })
  expect(response.status).toBe(200)
  expect(tasks).toHaveLength(1)
  await Promise.all(tasks)
  const options = fetcher.mock.calls[1][1]
  expect(options.headers['X-Pantau-Telemetry-Source']).toBe('edge')
  const raw =
    typeof options.body === 'string'
      ? options.body
      : new TextDecoder().decode(options.body)
  expect(JSON.parse(raw).events[0].session_id).toBe('')
  expect(await response.text()).not.toContain('private-key')
})

it('does not trust a browser-supplied edge-source header', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        data: { kind: 'key', scope: 'data:read', client_slug: 'fixture' },
      }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 202 }))
  const gateway = createClientGateway(
    {
      FE_ACCESS_MODE: 'client',
      PANTAU_API_ORIGIN: 'https://api.test',
      PANTAU_CLIENT_SLUG: 'fixture',
      PANTAU_API_KEY: 'private-key',
    },
    fetcher,
  )
  await gateway(
    new Request('https://fixture.test/api/v1/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'respond-async',
        'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
        'X-Pantau-Telemetry-Source': 'edge',
      },
      body: '{"events":[]}',
    }),
  )
  expect(fetcher.mock.calls[1][1].headers['X-Pantau-Telemetry-Source']).toBeUndefined()
})

it('keeps the page available when measurement configuration is invalid', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const env = {
    ASSETS: { fetch: vi.fn().mockResolvedValue(html()) },
    FE_ACCESS_MODE: 'client',
    PANTAU_API_ORIGIN: 'https://api.test/invalid',
    PANTAU_CLIENT_SLUG: 'fixture',
    PANTAU_API_KEY: 'private-key',
  }
  const response = await handleRequest(navigation(), env, vi.fn())
  expect(response.status).toBe(200)
  expect(await response.text()).toContain('<body>Map</body>')
  expect(warning).toHaveBeenCalledOnce()
})
