import { create } from 'zustand'
import { z } from 'zod'
import { queryClient } from '@/data/query-client'
import { useMapStore } from '@/store/map'
import { timeoutSignal } from '@/lib/abort'

const principalSchema = z.object({
  client_id: z.string().uuid(),
  client_slug: z.string(),
  username: z.string(),
  role: z.enum(['admin', 'reader']),
  platform_admin: z.boolean().optional(),
  request_limit: z.number().int().nonnegative().optional(),
  expires_at: z.string().optional(),
  user_id: z.string().uuid().optional(),
  kind: z.enum(['session', 'key']).optional(),
  scope: z.string().optional(),
})
const sessionSchema = z.object({ token: z.string().min(1), principal: principalSchema })
export type Principal = z.infer<typeof principalSchema>
type Session = {
  token: string | null
  principal: Principal | null
  status: 'restoring' | 'anonymous' | 'authenticated'
  generation: number
  accessMode: 'account' | 'client'
  accessError: string
  contractRevision: string | null
}
export const useSession = create<Session>(() => ({
  token: null,
  principal: null,
  status: 'restoring',
  generation: 0,
  accessMode: 'account',
  accessError: '',
  contractRevision: null,
}))
function clearClientData() {
  queryClient.clear()
  useMapStore.getState().resetHome()
  useMapStore.setState({ hoveredCode: null, location: { status: 'off' } })
}
export function expireSession() {
  clearClientData()
  useSession.setState((s) => ({
    token: null,
    principal: null,
    status: 'anonymous',
    contractRevision: null,
    generation: s.generation + 1,
  }))
}
function acceptSession(raw: unknown) {
  const next = sessionSchema.parse(raw)
  clearClientData()
  useSession.setState((s) => ({
    ...next,
    status: 'authenticated',
    contractRevision: null,
    generation: s.generation + 1,
  }))
}
export async function sessionRequest(path: string, method = 'POST', body: unknown = {}) {
  const { token, generation, accessMode } = useSession.getState()
  if (accessMode === 'client') throw new Error('Kelola akses melalui CMS Go.')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Console-Session': '1',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, {
    method,
    headers,
    body: method === 'GET' ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
    signal: timeoutSignal(15000),
  })
  if (
    res.status === 401 &&
    path !== '/auth/login' &&
    useSession.getState().generation === generation
  )
    expireSession()
  if (!res.ok)
    throw new Error(
      res.status === 429
        ? 'Terlalu banyak percobaan. Coba lagi setelah satu menit.'
        : res.status === 401
          ? 'Nama pengguna atau kata sandi salah, atau sesi telah berakhir.'
          : 'Layanan akses belum tersedia. Coba lagi.',
    )
  return res.status === 204 ? null : (res.json() as Promise<unknown>)
}
let restorePromise: Promise<void> | undefined
export function restoreSession() {
  return (restorePromise ??= restoreAccess().finally(() => {
    restorePromise = undefined
  }))
}
async function restoreAccess() {
  useSession.setState({ status: 'restoring', accessError: '' })
  try {
    const response = await fetch('/frontend/session', {
      cache: 'no-store',
      signal: timeoutSignal(15000),
    })
    if (response.headers.get('x-frontend-access') === 'client')
      useSession.setState({ accessMode: 'client' })
    if (
      response.ok &&
      response.headers.get('content-type')?.includes('application/json')
    ) {
      const access = z
        .object({ mode: z.literal('client'), principal: principalSchema, contract_revision: z.string().max(64).nullable().optional() })
        .parse(await response.json())
      clearClientData()
      useSession.setState((s) => ({
        token: null,
        principal: access.principal,
        contractRevision: access.contract_revision || null,
        accessMode: 'client',
        status: 'authenticated',
        generation: s.generation + 1,
      }))
      return
    }
    if (response.status !== 404 && response.status !== 200)
      throw new Error('Akses client belum tersedia. Periksa konfigurasi server FE.')
    useSession.setState({ accessMode: 'account' })
    acceptSession(await sessionRequest('/auth/browser-session'))
  } catch (error) {
    expireSession()
    useSession.setState({
      accessError: error instanceof Error ? error.message : 'Akses belum tersedia.',
    })
  }
}
export async function login(username: string, password: string) {
  acceptSession(await sessionRequest('/auth/login', 'POST', { username, password }))
}
export async function logout() {
  await sessionRequest('/auth/browser-session', 'DELETE')
  expireSession()
}
export async function switchClient(clientSlug: string) {
  acceptSession(
    await sessionRequest('/auth/client-session', 'POST', { client: clientSlug }),
  )
}
