import { it, expect, vi } from 'vitest'
import { createClientGateway } from './client-gateway.mjs'
const env = {
  FE_ACCESS_MODE: 'client',
  PANTAU_API_ORIGIN: 'http://127.0.0.1:8080',
  PANTAU_CLIENT_SLUG: 'fixture',
  PANTAU_API_KEY: 'synthetic-server-only',
}
const principal = {
  client_id: '00000000-0000-4000-8000-000000000001',
  client_slug: 'fixture',
  kind: 'key',
  scope: 'data:read',
  role: 'reader',
}
it('preserves backend lifecycle headers and exposes only the contract revision in the handshake', async () => {
  const lifecycle = {
    'X-Pantau-Contract-Revision': '2026-10-17.1',
    Deprecation: '@1792198800',
    Sunset: 'Mon, 16 Nov 2026 00:00:00 GMT',
    Link: '</api-guide#contract-updates>; rel="deprecation"',
  }
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: principal }, { headers: lifecycle }))
    .mockResolvedValueOnce(Response.json({ data: principal }))
    .mockResolvedValueOnce(Response.json({ data: [] }, { headers: lifecycle }))
  const gateway = createClientGateway(env, fetcher)
  const session = await gateway(new Request('http://localhost/frontend/session'))
  const body = await session!.json()
  expect(body.contract_revision).toBe(lifecycle['X-Pantau-Contract-Revision'])
  expect(JSON.stringify(body)).not.toContain(env.PANTAU_API_KEY)
  const response = await gateway(new Request('http://localhost/api/v1/summary'))
  for (const [name, value] of Object.entries(lifecycle))
    expect(response!.headers.get(name)).toBe(value)
})
it('only server forwards key; session returns fixed reader identity without token', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
  const gateway = createClientGateway(env, fetcher)
  const response = await gateway(new Request('http://localhost/frontend/session'))
  const body = await response!.json()
  expect(body.principal.client_slug).toBe('fixture')
  expect(JSON.stringify(body)).not.toContain(env.PANTAU_API_KEY)
  expect(body.token).toBeUndefined()
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe(
    'Bearer ' + env.PANTAU_API_KEY,
  )
  expect(fetcher.mock.calls[0][1].headers['User-Agent']).toBe('pantau-mala-gateway/1.0')
})
it('forwards browser and trusted edge metadata without forwarding visitor credentials', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
  const gateway = createClientGateway(env, fetcher)
  const request = new Request('http://localhost/frontend/session', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140.0.0.0 Safari/537.36',
      Origin: 'http://localhost',
      Referer: 'http://localhost/dashboard?token=private-referrer#private-fragment',
      'CF-Connecting-IP': '203.0.113.7',
      'X-Forwarded-For': '198.51.100.99',
      Cookie: 'session=visitor-secret',
    },
  })
  await gateway(request, { runtime: 'cloudflare', clientIP: '203.0.113.7' })
  const headers = fetcher.mock.calls[0][1].headers
  expect(headers['User-Agent']).toContain('Mozilla/5.0')
  expect(headers.Origin).toBe('http://localhost')
  expect(headers.Referer).toBe('http://localhost/')
  expect(headers['X-Forwarded-For']).toBe('203.0.113.7')
  expect(headers.Authorization).toBe('Bearer ' + env.PANTAU_API_KEY)
  expect(JSON.stringify(headers)).not.toMatch(
    /visitor-secret|private-referrer|private-fragment|198\.51\.100\.99/,
  )
})
it('never trusts visitor IP headers without adapter-supplied metadata', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
  const gateway = createClientGateway(env, fetcher)
  await gateway(
    new Request('http://localhost/frontend/session', {
      headers: {
        'CF-Connecting-IP': '198.51.100.99',
        'X-Forwarded-For': '198.51.100.98',
        'X-Real-IP': '198.51.100.97',
      },
    }),
  )
  const headers = fetcher.mock.calls[0][1].headers
  expect(headers['X-Forwarded-For']).toBeUndefined()
  expect(headers['X-Real-IP']).toBeUndefined()
  expect(headers['CF-Connecting-IP']).toBeUndefined()
})
it.each(['203.0.113.7', '2001:db8::7'])(
  'forwards a validated adapter IP %s',
  async (clientIP) => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
    await createClientGateway(env, fetcher)(
      new Request('http://localhost/frontend/session'),
      { runtime: 'cloudflare', clientIP },
    )
    expect(fetcher.mock.calls[0][1].headers['X-Forwarded-For']).toBe(clientIP)
    expect(fetcher.mock.calls[0][1].headers['User-Agent']).toBe('pantau-mala-worker/1.0')
  },
)
it.each([
  '999.1.1.1',
  '127.1',
  '127.0.0.01',
  '203.0.113.7, 198.51.100.99',
  'example.test',
  '[2001:db8::7]',
  '2001:db8::7%eth0',
  '2001:::7',
  '',
])('ignores invalid adapter IP %s', async (clientIP) => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
  await createClientGateway(env, fetcher)(
    new Request('http://localhost/frontend/session'),
    { clientIP },
  )
  expect(fetcher.mock.calls[0][1].headers['X-Forwarded-For']).toBeUndefined()
})
it('keeps metadata request-scoped and bounds the forwarded user agent', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
  const gateway = createClientGateway(env, fetcher)
  await gateway(
    new Request('http://localhost/frontend/session', {
      headers: { 'User-Agent': 'custom-client/'.repeat(100) },
    }),
    { runtime: 'cloudflare', clientIP: '203.0.113.7' },
  )
  await gateway(new Request('http://localhost/frontend/session'))
  expect(fetcher.mock.calls[0][1].headers['User-Agent']).toHaveLength(512)
  expect(fetcher.mock.calls[1][1].headers['X-Forwarded-For']).toBeUndefined()
  expect(fetcher.mock.calls[1][1].headers['User-Agent']).toBe('pantau-mala-gateway/1.0')
})
it('refuses management, writes, supplied identity, unknown routes and cross-origin', async () => {
  const fetcher = vi.fn()
  const gateway = createClientGateway(env, fetcher)
  for (const [path, init, status] of [
    ['/auth/keys', {}, 403],
    ['/api/v1/regions', { method: 'POST' }, 405],
    ['/api/v1/regions?client_id=other', {}, 400],
    ['/api/v1/operations', {}, 404],
    ['/api/v1/regions', { headers: { Authorization: 'Bearer visitor' } }, 400],
    ['/api/v1/regions', { headers: { Origin: 'https://other.example' } }, 403],
  ] as const) {
    expect((await gateway(new Request('http://localhost' + path, init)))!.status).toBe(
      status,
    )
  }
  expect(fetcher).not.toHaveBeenCalled()
})
it.each([
  '/api/v1/hotspot-reports/total',
  '/api/v1/hotspot-reports/counts/by-region',
])('forwards public report aggregate %s', async (path) => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: principal }))
    .mockResolvedValueOnce(Response.json({ data: {} }))
  const response = await createClientGateway(env, fetcher)(
    new Request('http://localhost' + path),
  )
  expect(response!.status).toBe(200)
  expect(String(fetcher.mock.calls[1][0])).toBe('http://127.0.0.1:8080' + path)
})
it.each([
  ['/api/v1/hotspot-reports/photo', { content_type: 'image/jpeg', content_length: 128 }],
  [
    '/api/v1/hotspot-reports',
    {
      lat: -2.1,
      lon: 113.5,
      sighting: 'asap',
      author_name: 'Sari',
      photo_url: 'https://media.example/report.jpg',
    },
  ],
])('forwards the allowed report write %s as bounded JSON', async (path, body) => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: principal }))
    .mockResolvedValueOnce(Response.json({ data: body }, { status: 201 }))
  const response = await createClientGateway(
    env,
    fetcher,
  )(
    new Request('http://localhost' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
  expect(response!.status).toBe(201)
  expect(String(fetcher.mock.calls[1][0])).toBe('http://127.0.0.1:8080' + path)
  expect(fetcher.mock.calls[1][1].method).toBe('POST')
  expect(fetcher.mock.calls[1][1].headers['Content-Type']).toBe('application/json')
  expect(await new Response(fetcher.mock.calls[1][1].body).json()).toEqual(body)
})
it('rejects invalid or oversized report writes before contacting the backend', async () => {
  const gateway = createClientGateway(env, vi.fn())
  expect(
    (await gateway(
      new Request('http://localhost/api/v1/hotspot-reports', {
        method: 'POST',
        body: '{}',
      }),
    ))!.status,
  ).toBe(415)
  expect(
    (await gateway(
      new Request('http://localhost/api/v1/hotspot-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'x'.repeat(9 * 1024) }),
      }),
    ))!.status,
  ).toBe(413)
})
it('requires the explicit async telemetry contract and forwards its body server-side', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: principal }))
    .mockResolvedValueOnce(
      Response.json(
        { data: { accepted: 1 } },
        { status: 202, headers: { 'Preference-Applied': 'respond-async' } },
      ),
    )
  const gateway = createClientGateway(env, fetcher)
  const payload = JSON.stringify({ events: [] })
  expect(
    (await gateway(
      new Request('http://localhost/api/v1/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }),
    ))!.status,
  ).toBe(400)
  expect(fetcher).not.toHaveBeenCalled()
  const response = await gateway(
    new Request('http://localhost/api/v1/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'respond-async',
        'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
      },
      body: payload,
    }),
    {
      runtime: 'cloudflare',
      clientIP: '203.0.113.7',
      clientCountry: 'ID',
      clientCity: 'Jakarta',
    },
  )
  expect(response!.status).toBe(202)
  expect(fetcher).toHaveBeenCalledTimes(2)
  expect(fetcher.mock.calls[1][1].method).toBe('POST')
  expect(fetcher.mock.calls[1][1].headers['X-Pantau-Geo-City']).toBe('Jakarta')
  expect(await new Response(fetcher.mock.calls[1][1].body).text()).toBe(payload)
})
it('verifies fixed client and scope before serving business data', async () => {
  for (const changed of [
    { client_slug: 'other' },
    { scope: 'mcp:read' },
    { kind: 'session' },
  ]) {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ data: { ...principal, ...changed } }))
    const gateway = createClientGateway(env, fetcher)
    expect((await gateway(new Request('http://localhost/api/v1/summary')))!.status).toBe(
      503,
    )
    expect(fetcher).toHaveBeenCalledTimes(1)
  }
})
it('forwards only allowed data and handles revoked keys, redirects, network failures without secrets', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: principal }))
    .mockResolvedValueOnce(Response.json({ data: [] }))
  const gateway = createClientGateway(env, fetcher)
  expect(
    (await gateway(new Request('http://localhost/api/v1/regions?limit=1000')))!.status,
  ).toBe(200)
  expect(String(fetcher.mock.calls[1][0])).toBe(
    'http://127.0.0.1:8080/api/v1/regions?limit=1000',
  )
  for (const path of [
    '/api/v1/indicators/soil-moisture?lat=-6.2&lon=106.8',
    '/api/v1/external-events/nasa-eonet?status=open',
    '/api/v1/providers/registry',
    '/api/v1/providers/provenance?limit=10',
  ]) {
    const f = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: principal }))
      .mockResolvedValueOnce(Response.json({ data: [] }))
    const g = createClientGateway(env, f)
    expect((await g(new Request('http://localhost' + path)))!.status).toBe(200)
    expect(String(f.mock.calls[1][0])).toBe('http://127.0.0.1:8080' + path)
  }
  for (const result of [
    new Response('secret detail', { status: 401 }),
    new Response(null, { status: 302 }),
  ]) {
    const rejected = await createClientGateway(
      env,
      vi.fn().mockResolvedValue(result),
    )(new Request('http://localhost/frontend/session'))
    expect(rejected!.status).toBe(503)
    expect(await rejected!.text()).not.toContain('secret detail')
  }
  const failed = await createClientGateway(
    env,
    vi.fn().mockRejectedValue(new Error(env.PANTAU_API_KEY)),
  )(new Request('http://localhost/frontend/session'))
  expect(await failed!.text()).not.toContain(env.PANTAU_API_KEY)
})
it('fails closed on missing secrets and insecure external origin', () => {
  expect(() => createClientGateway({ ...env, PANTAU_API_KEY: '' })).toThrow()
  expect(() =>
    createClientGateway({ ...env, PANTAU_API_ORIGIN: 'http://external.example' }),
  ).toThrow()
})

it('rejects oversized streamed telemetry before authenticating upstream', async () => {
  const fetcher = vi.fn()
  const request = new Request('http://localhost/api/v1/telemetry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'respond-async',
      'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
    },
    body: ' '.repeat(17 * 1024),
  })
  const result = await createClientGateway(env, fetcher)(request)
  expect(result!.status).toBe(413)
  expect(fetcher).not.toHaveBeenCalled()
})

it('ignores browser-supplied geo headers and uses only encoded adapter metadata', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
  const gateway = createClientGateway(env, fetcher)
  const makeRequest = () =>
    new Request('http://localhost/frontend/session', {
      headers: { 'X-Pantau-Geo-City': 'Fake City', 'CF-IPCity': 'Fake City' },
    })
  await gateway(makeRequest(), {
    runtime: 'cloudflare',
    clientCountry: 'BR',
    clientCity: 'São Paulo',
  })
  expect(fetcher.mock.calls[0][1].headers['X-Pantau-Geo-City']).toBe('S%C3%A3o%20Paulo')
  await gateway(makeRequest())
  expect(fetcher.mock.calls[1][1].headers['X-Pantau-Geo-City']).toBeUndefined()
})
