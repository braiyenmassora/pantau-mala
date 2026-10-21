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
it('verifies fixed client and scope only on session bootstrap', async () => {
  for (const changed of [
    { client_slug: 'other' },
    { scope: 'mcp:read' },
    { kind: 'session' },
  ]) {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ data: { ...principal, ...changed } }))
    const gateway = createClientGateway(env, fetcher)
    expect(
      (await gateway(new Request('http://localhost/frontend/session')))!.status,
    ).toBe(503)
    expect(fetcher).toHaveBeenCalledTimes(1)
  }
})
it('forwards data with env key only (no /auth/me); session still checks identity', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: [] }))
  const gateway = createClientGateway(env, fetcher)
  expect(
    (await gateway(new Request('http://localhost/api/v1/regions?limit=1000')))!.status,
  ).toBe(200)
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(String(fetcher.mock.calls[0][0])).toBe(
    'http://127.0.0.1:8080/api/v1/regions?limit=1000',
  )
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe(
    'Bearer ' + env.PANTAU_API_KEY,
  )
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
it('forwards telemetry POST with server key, UA, origin, and CF geo', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
  const gateway = createClientGateway(env, fetcher)
  const body = JSON.stringify({
    events: [
      {
        id: '00000000-0000-4000-8000-000000000010',
        session_id: '',
        type: 'page_view',
        path: '/',
        referrer: '',
      },
    ],
  })
  const request = new Request('http://localhost/api/v1/telemetry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'respond-async',
      'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
      'User-Agent': 'Mozilla/5.0 (Test) Chrome/120.0.0.0',
      Origin: 'http://localhost',
      Referer: 'http://localhost/',
      // spoof — harus diabaikan tanpa request.cf
      'X-Pantau-Geo-Country': 'XX',
    },
    body,
  })
  Object.defineProperty(request, 'cf', {
    value: { country: 'ID', region: 'DKI Jakarta', city: 'Jakarta' },
  })
  const response = await gateway(request)
  expect(response!.status).toBe(202)
  expect(String(fetcher.mock.calls[0][0])).toBe('http://127.0.0.1:8080/api/v1/telemetry')
  const upstreamHeaders = fetcher.mock.calls[0][1].headers
  expect(upstreamHeaders.Authorization).toBe('Bearer ' + env.PANTAU_API_KEY)
  expect(upstreamHeaders.Prefer).toBe('respond-async')
  expect(upstreamHeaders['X-Pantau-Telemetry-Transport']).toBe('fetch-keepalive')
  expect(upstreamHeaders['User-Agent']).toBe('Mozilla/5.0 (Test) Chrome/120.0.0.0')
  expect(upstreamHeaders.Origin).toBe('http://localhost')
  expect(upstreamHeaders['X-Pantau-Geo-Source']).toBe('cloudflare')
  expect(upstreamHeaders['X-Pantau-Geo-Country']).toBe('ID')
  expect(upstreamHeaders['X-Pantau-Geo-City']).toBe(encodeURIComponent('Jakarta'))
})
it('rejects browser identity on telemetry', async () => {
  const gateway = createClientGateway(env, vi.fn())
  expect(
    (await gateway(
      new Request('http://localhost/api/v1/telemetry', {
        method: 'POST',
        headers: { Authorization: 'Bearer visitor' },
        body: '{}',
      }),
    ))!.status,
  ).toBe(400)
})
it('forwards hotspot report reads and writes with server key only', async () => {
  const created = {
    data: { id: 'e9170c75-3623-4471-9ca5-4f2c4f9f86fd', sighting: 'asap' },
  }
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: [] }))
    .mockResolvedValueOnce(Response.json(created, { status: 201 }))
    .mockResolvedValueOnce(
      Response.json({
        data: {
          upload_url: 'https://storage.example/put',
          public_url: 'https://media.example/report.jpg',
          required_headers: { 'Content-Type': 'image/jpeg' },
        },
      }, { status: 201 }),
    )
  const gateway = createClientGateway(env, fetcher)

  const list = await gateway(
    new Request('http://localhost/api/v1/hotspot-reports?region_code=62.01&limit=50'),
  )
  expect(list!.status).toBe(200)
  expect(String(fetcher.mock.calls[0][0])).toBe(
    'http://127.0.0.1:8080/api/v1/hotspot-reports?region_code=62.01&limit=50',
  )

  const body = JSON.stringify({
    lat: -2.1,
    lon: 113.5,
    sighting: 'asap',
    author_name: 'Sari W.',
    photo_url: 'https://media.example/report.jpg',
  })
  const post = await gateway(
    new Request('http://localhost/api/v1/hotspot-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost' },
      body,
    }),
  )
  expect(post!.status).toBe(201)
  expect(await post!.json()).toEqual(created)
  const postCall = fetcher.mock.calls[1]
  expect(postCall[1].method).toBe('POST')
  expect(postCall[1].headers.Authorization).toBe('Bearer ' + env.PANTAU_API_KEY)
  expect(postCall[1].headers.Origin).toBe('http://localhost')
  expect(await new Request('http://x', postCall[1]).text()).toBe(body)

  const photo = await gateway(
    new Request('http://localhost/api/v1/hotspot-reports/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'image/jpeg', content_length: 123 }),
    }),
  )
  expect(photo!.status).toBe(201)
})
it('rejects report writes to other routes and unknown report queries', async () => {
  const fetcher = vi.fn()
  const gateway = createClientGateway(env, fetcher)
  expect(
    (await gateway(
      new Request('http://localhost/api/v1/hotspot-reports/counts', {
        method: 'POST',
        body: '{}',
      }),
    ))!.status,
  ).toBe(405)
  expect(
    (await gateway(
      new Request('http://localhost/api/v1/hotspot-reports?client_id=other'),
    ))!.status,
  ).toBe(400)
  expect(fetcher).not.toHaveBeenCalled()
})
it('masks upstream telemetry 401 as 502', async () => {
  const gateway = createClientGateway(
    env,
    vi.fn().mockResolvedValue(new Response('nope', { status: 401 })),
  )
  const response = await gateway(
    new Request('http://localhost/api/v1/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }),
  )
  expect(response!.status).toBe(502)
  expect(await response!.text()).not.toContain('nope')
})
