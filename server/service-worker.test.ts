import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'

const source = readFileSync(resolve('public/sw.js'), 'utf8')

function workerFixture() {
  const handlers = new Map<string, (event: Record<string, unknown>) => void>()
  const cache = { addAll: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue(undefined) }
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi.fn().mockResolvedValue(['pantaumala-v1', 'unrelated-application-cache', 'pantaumala-v2-__PANTAU_BUILD__']),
    delete: vi.fn().mockResolvedValue(true),
    match: vi.fn().mockResolvedValue(undefined),
  }
  const skipWaiting = vi.fn().mockResolvedValue(undefined)
  const fetcher = vi.fn().mockResolvedValue(new Response('latest shell'))
  runInNewContext(source, {
    URL, Response, Headers, caches, fetch: fetcher,
    self: { location: { origin: 'https://fixture.test' }, addEventListener: (name: string, handler: (event: Record<string, unknown>) => void) => handlers.set(name, handler), skipWaiting, clients: { claim: vi.fn().mockResolvedValue(undefined) } },
  })
  const dispatch = async (name: string, extra: Record<string, unknown> = {}) => {
    const background: Promise<unknown>[] = []
    let response: Promise<Response> | undefined
    handlers.get(name)?.({ ...extra, waitUntil: (promise: Promise<unknown>) => background.push(promise), respondWith: (promise: Promise<Response>) => { response = promise } })
    const result = await response
    await Promise.all(background)
    return result
  }
  return { dispatch, cache, caches, skipWaiting, fetcher }
}

it('waits for explicit update consent and removes only this application caches', async () => {
  const fixture = workerFixture()
  await fixture.dispatch('install')
  expect(fixture.skipWaiting).not.toHaveBeenCalled()
  await fixture.dispatch('message', { data: { type: 'SKIP_WAITING' } })
  expect(fixture.skipWaiting).toHaveBeenCalledTimes(1)
  await fixture.dispatch('activate')
  expect(fixture.caches.delete.mock.calls).toEqual([['pantaumala-v1']])
})

it('serves fresh navigation and refreshes the offline shell', async () => {
  const fixture = workerFixture()
  const response = await fixture.dispatch('fetch', { request: { method: 'GET', mode: 'navigate', url: 'https://fixture.test/' } })
  expect(await response?.text()).toBe('latest shell')
  expect(fixture.cache.put.mock.calls[0][0]).toBe('/index.html')
})

it('does not replay a server page-view identity from the offline shell', async () => {
  const fixture = workerFixture()
  const id = '00000000-0000-4000-8000-000000000001'
  fixture.fetcher.mockResolvedValue(new Response(`<head><meta name="pantau-page-view" content="${id}"></head>`, { headers: { 'Content-Type': 'text/html' } }))
  const response = await fixture.dispatch('fetch', { request: { method: 'GET', mode: 'navigate', url: 'https://fixture.test/' } })
  expect(await response?.text()).toContain(id)
  expect(await fixture.cache.put.mock.calls[0][1].text()).not.toContain('pantau-page-view')
})

it('awaits the root fallback if index.html is unavailable offline', async () => {
  const fixture = workerFixture()
  fixture.fetcher.mockRejectedValue(new TypeError('offline'))
  fixture.caches.match.mockResolvedValueOnce(undefined).mockResolvedValueOnce(new Response('offline shell'))
  const response = await fixture.dispatch('fetch', { request: { method: 'GET', mode: 'navigate', url: 'https://fixture.test/' } })
  expect(await response?.text()).toBe('offline shell')
  expect(fixture.caches.match.mock.calls).toEqual([['/index.html'], ['/']])
})

it.each(['/api', '/api/v1/summary', '/auth', '/auth/me', '/frontend/session', '/sw.js', 'https://other.test/assets/map.js'])(
  'never caches dynamic or cross-origin requests: %s', async (path) => {
    const fixture = workerFixture()
    const response = await fixture.dispatch('fetch', { request: { method: 'GET', url: new URL(path, 'https://fixture.test').href } })
    expect(response).toBeUndefined()
    expect(fixture.fetcher).not.toHaveBeenCalled()
    expect(fixture.caches.match).not.toHaveBeenCalled()
  },
)

it('versions every build deterministically and changes version when assets change', () => {
  const directory = mkdtempSync(join(tmpdir(), 'pantau-pwa-'))
  const script = resolve('scripts/version-service-worker.mjs')
  try {
    writeFileSync(join(directory, 'index.html'), '<html>version one</html>')
    writeFileSync(join(directory, 'sw.js'), source)
    execFileSync(process.execPath, [script, directory])
    const first = readFileSync(join(directory, 'sw.js'), 'utf8')
    expect(first).not.toContain('__PANTAU_BUILD__')
    execFileSync(process.execPath, [script, directory])
    expect(readFileSync(join(directory, 'sw.js'), 'utf8')).toBe(first)
    writeFileSync(join(directory, 'index.html'), '<html>version two</html>')
    execFileSync(process.execPath, [script, directory])
    expect(readFileSync(join(directory, 'sw.js'), 'utf8')).not.toBe(first)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
