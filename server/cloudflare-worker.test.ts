import { describe, expect, it, vi } from 'vitest'
import { handleRequest } from '../worker'

const principal = {
  client_id: '00000000-0000-4000-8000-000000000001',
  client_slug: 'fixture',
  kind: 'key',
  scope: 'data:read',
  role: 'reader',
}
function environment() {
  return {
    ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('frontend assets')) },
    FE_ACCESS_MODE: 'client',
    PANTAU_API_ORIGIN: 'https://api.example.test',
    PANTAU_CLIENT_SLUG: 'fixture',
    PANTAU_API_KEY: 'private-fixture-key',
  }
}
const request = (pathname: string, init?: RequestInit) =>
  new Request(`https://fixture.workers.dev${pathname}`, init)

describe('Cloudflare Worker routing', () => {
  it('serves assets even when the data key has not been configured', async () => {
    const env = { ...environment(), PANTAU_API_KEY: '' }
    expect(await (await handleRequest(request('/'), env)).text()).toBe('frontend assets')
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce()
  })

  it('returns only the reader identity, never its private key', async () => {
    const env = environment()
    const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
    const response = await handleRequest(request('/frontend/session'), env, fetcher)
    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('fixture')
    expect(text).not.toContain(env.PANTAU_API_KEY)
    expect(env.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('proxies read-only data to the configured backend with a server credential', async () => {
    const env = environment()
    const fetcher = vi.fn().mockResolvedValue(Response.json({ data: [] }))
    const response = await handleRequest(
      request('/api/v1/regions?limit=10'),
      env,
      fetcher,
    )
    expect(response.status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0][0].toString()).toBe(
      'https://api.example.test/api/v1/regions?limit=10',
    )
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe(
      `Bearer ${env.PANTAU_API_KEY}`,
    )
    expect(env.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it.each(['/api', '/api/private', '/auth'])(
    'does not serve the SPA on reserved route %s',
    async (route) => {
      const env = environment()
      const response = await handleRequest(request(route), env, vi.fn())
      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.headers.get('Content-Type')).toContain('application/json')
      expect(env.ASSETS.fetch).not.toHaveBeenCalled()
    },
  )

  it.each(['client', 'account'] as const)(
    'fails closed for missing credentials in %s mode',
    async (mode) => {
      const env = { ...environment(), PANTAU_API_KEY: '', FE_ACCESS_MODE: mode }
      const response = await handleRequest(request('/frontend/session'), env, vi.fn())
      expect(response.status).toBe(503)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Frontend-Access')).toBe(
        mode === 'client' ? 'client' : null,
      )
      expect(env.ASSETS.fetch).not.toHaveBeenCalled()
    },
  )

  it('proxies report photos from the public R2 origin, not assets', async () => {
    const env = environment()
    const fetcher = vi.fn().mockResolvedValue(
      new Response('jpg-bytes', {
        headers: { 'Content-Type': 'image/jpeg', ETag: '"etag-1"' },
      }),
    )
    const key =
      'hotspot-reports/36a7bdb0-0fab-42f4-8f90-272b7c9e2bb4/6cde8c5a-bcf3-4cc0-a394-6a88ad118103.jpg'
    const response = await handleRequest(request(`/report-photos/${key}`), env, fetcher)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
    expect(response.headers.get('Cache-Control')).toContain('immutable')
    expect(await response.text()).toBe('jpg-bytes')
    expect(fetcher).toHaveBeenCalledWith(
      `https://pub-32d942c9574c4f02a9c7fb2e260e33e2.r2.dev/${key}`,
      { method: 'GET' },
    )
    expect(env.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('rejects bad photo keys, missing objects and writes', async () => {
    const env = environment()
    const missing = vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    const key =
      'hotspot-reports/36a7bdb0-0fab-42f4-8f90-272b7c9e2bb4/6cde8c5a-bcf3-4cc0-a394-6a88ad118103.jpg'
    expect(
      (
        await handleRequest(
          request('/report-photos/hotspot-reports/bukan-uuid/foto.jpg'),
          env,
          missing,
        )
      ).status,
    ).toBe(404)
    expect(missing).not.toHaveBeenCalled()
    expect(
      (await handleRequest(request(`/report-photos/${key}`), env, missing)).status,
    ).toBe(404)
    expect(
      (
        await handleRequest(
          request(`/report-photos/${key}`, { method: 'POST' }),
          env,
          missing,
        )
      ).status,
    ).toBe(405)
    expect(env.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('rejects management, writes and requests from another origin', async () => {
    const env = environment()
    for (const [path, init, status] of [
      ['/auth/login', undefined, 403],
      ['/api/v1/regions', { method: 'POST' }, 405],
      ['/api/v1/regions', { headers: { Origin: 'https://other.example' } }, 403],
    ] as const) {
      const fetcher = vi.fn()
      expect((await handleRequest(request(path, init), env, fetcher)).status).toBe(status)
      expect(fetcher).not.toHaveBeenCalled()
    }
  })
})
