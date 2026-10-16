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
