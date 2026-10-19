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
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: principal }))
      .mockResolvedValueOnce(Response.json({ data: [] }))
    const response = await handleRequest(
      request('/api/v1/regions?limit=10', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0',
          'CF-Connecting-IP': '203.0.113.8',
          'X-Forwarded-For': '198.51.100.99',
          Referer: 'https://fixture.workers.dev/map?token=private-referrer',
        },
      }),
      env,
      fetcher,
    )
    expect(response.status).toBe(200)
    expect(fetcher.mock.calls[1][0].toString()).toBe(
      'https://api.example.test/api/v1/regions?limit=10',
    )
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe(
      `Bearer ${env.PANTAU_API_KEY}`,
    )
    expect(fetcher.mock.calls[1][1].headers['User-Agent']).toContain('Mozilla/5.0')
    expect(fetcher.mock.calls[1][1].headers['X-Forwarded-For']).toBe('203.0.113.8')
    expect(fetcher.mock.calls[1][1].headers.Origin).toBeUndefined()
    expect(fetcher.mock.calls[1][1].headers.Referer).toBe('https://fixture.workers.dev/')
    expect(fetcher.mock.calls[0][1].headers).toEqual(fetcher.mock.calls[1][1].headers)
    expect(env.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('revalidates auth while reusing a short-lived public data response', async () => {
    const stored = new Map<string, Response>()
    const edgeCache = {
      match: vi.fn(async (key: Request) => stored.get(key.url)?.clone()),
      put: vi.fn(async (key: Request, value: Response) => {
        stored.set(key.url, value.clone())
      }),
    }
    const upstreamPaths: string[] = []
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(input instanceof Request ? input.url : input.toString())
        .pathname
      upstreamPaths.push(path)
      return path === '/auth/me'
        ? Response.json({ data: principal })
        : Response.json({ data: [{ code: 'fixture' }] })
    })

    const first = await handleRequest(
      request('/api/v1/regions?limit=10'),
      environment(),
      fetcher,
      undefined,
      edgeCache,
    )
    const second = await handleRequest(
      request('/api/v1/regions?limit=10'),
      environment(),
      fetcher,
      undefined,
      edgeCache,
    )

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(upstreamPaths.filter((path) => path === '/auth/me')).toHaveLength(2)
    expect(upstreamPaths.filter((path) => path === '/api/v1/regions')).toHaveLength(1)
    expect(edgeCache.put).toHaveBeenCalledOnce()
  })

  it('identifies the gateway when the visitor sends no user agent without inventing an IP', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ data: principal }))
    const response = await handleRequest(
      request('/frontend/session', {
        headers: { 'X-Forwarded-For': '198.51.100.99' },
      }),
      environment(),
      fetcher,
    )
    expect(response.status).toBe(200)
    expect(fetcher.mock.calls[0][1].headers['User-Agent']).toBe('pantau-mala-worker/1.0')
    expect(fetcher.mock.calls[0][1].headers['X-Forwarded-For']).toBeUndefined()
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
