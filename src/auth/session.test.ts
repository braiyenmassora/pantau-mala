import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import {
  useSession,
  login,
  switchClient,
  logout,
  expireSession,
  restoreSession,
} from './session'
import { queryClient } from '@/data/query-client'
import { useMapStore } from '@/store/map'
import { getData } from '@/data/queries'
const a = {
  client_id: '00000000-0000-4000-8000-000000000001',
  client_slug: 'fixture-a',
  username: 'fixture',
  role: 'reader' as const,
}
const b = {
  ...a,
  client_id: '00000000-0000-4000-8000-000000000002',
  client_slug: 'fixture-b',
}
beforeEach(() => {
  expireSession()
  useSession.setState({ generation: 0, accessMode: 'account', accessError: '' })
})
afterEach(() => {
  vi.unstubAllGlobals()
  queryClient.clear()
})
it('login sends credentials only to same-origin auth with cookie intent', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ token: 'pms_synthetic', principal: a })),
    )
  vi.stubGlobal('fetch', fetcher)
  await login('fixture', 'synthetic-password')
  const [path, options] = fetcher.mock.calls[0]
  expect(path).toBe('/auth/login')
  expect(options.credentials).toBe('same-origin')
  expect(options.headers['X-Console-Session']).toBe('1')
  expect(JSON.parse(options.body)).toEqual({
    username: 'fixture',
    password: 'synthetic-password',
  })
  expect(useSession.getState().principal?.client_id).toBe(a.client_id)
})
it('switch rotates session and clears old client cache, selection and location', async () => {
  useSession.setState({ token: 'pms_old', principal: a, status: 'authenticated' })
  queryClient.setQueryData(['regions', a.client_id, 0], ['private fixture A'])
  useMapStore.setState({
    selectedCode: '99.01',
    location: { status: 'active', coords: { lon: 114, lat: -2 } },
  })
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ token: 'pms_new', principal: b })))
  vi.stubGlobal('fetch', fetcher)
  await switchClient('fixture-b')
  expect(fetcher.mock.calls[0][0]).toBe('/auth/client-session')
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ client: 'fixture-b' })
  expect(queryClient.getQueryData(['regions', a.client_id, 0])).toBeUndefined()
  expect(useMapStore.getState().selectedCode).toBeNull()
  expect(useMapStore.getState().location.coords).toBeUndefined()
  expect(useSession.getState().token).toBe('pms_new')
})
it('failed logout retains session so failure can be retried', async () => {
  useSession.setState({ token: 'pms_old', principal: a, status: 'authenticated' })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })))
  await expect(logout()).rejects.toThrow()
  expect(useSession.getState().status).toBe('authenticated')
})
it('late old-client 401 cannot expire a newly switched session', async () => {
  useSession.setState({ token: 'pms_old', principal: a, status: 'authenticated' })
  let respond: (value: Response) => void = () => {}
  vi.stubGlobal(
    'fetch',
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          respond = resolve
        }),
    ),
  )
  const result = getData('/regions', (x) => x)
  useSession.setState({
    token: 'pms_new',
    principal: b,
    status: 'authenticated',
    generation: 1,
  })
  respond(new Response('{}', { status: 401 }))
  await expect(result).rejects.toThrow()
  expect(useSession.getState().token).toBe('pms_new')
})
it('current-client 401 clears authenticated state and client data', async () => {
  useSession.setState({ token: 'pms_old', principal: a, status: 'authenticated' })
  queryClient.setQueryData(['private'], ['fixture'])
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  await expect(getData('/regions', (x) => x)).rejects.toThrow()
  expect(useSession.getState().status).toBe('anonymous')
  expect(queryClient.getQueryData(['private'])).toBeUndefined()
})

it('client gateway restores without bearer and data requests contain no credential', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json(
        { mode: 'client', contract_revision: '2026-10-17.1', principal: { ...a, kind: 'key', scope: 'data:read' } },
        { headers: { 'X-Frontend-Access': 'client' } },
      ),
    )
    .mockResolvedValueOnce(Response.json({ data: [] }))
  vi.stubGlobal('fetch', fetcher)
  await restoreSession()
  expect(useSession.getState().token).toBeNull()
  expect(useSession.getState().accessMode).toBe('client')
  expect(useSession.getState().contractRevision).toBe('2026-10-17.1')
  expect(useSession.getState().status).toBe('authenticated')
  await getData('/regions', (x) => x)
  expect(fetcher.mock.calls[1][1].headers.Authorization).toBeUndefined()
  await expect(switchClient('fixture-b')).rejects.toThrow('CMS Go')
})
it('client gateway outage fails closed without account login fallback', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json(
        { error: 'unavailable' },
        { status: 503, headers: { 'X-Frontend-Access': 'client' } },
      ),
    )
  vi.stubGlobal('fetch', fetcher)
  await restoreSession()
  expect(useSession.getState().accessMode).toBe('client')
  expect(useSession.getState().status).toBe('anonymous')
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(useSession.getState().accessError).toContain('konfigurasi')
})
