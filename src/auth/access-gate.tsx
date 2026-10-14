import { Brand } from '@/components/common/brand'
import { copy } from '@/copy/id'
import { sessionRequest, switchClient } from './session'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, LogOut } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { login, logout, restoreSession, useSession } from './session'
import { focusRing } from '@/components/common/focus-ring'
import { SearchableSelect } from '@/components/common'

export function AccessGate({ children }: { children: ReactNode }) {
  const accessMode = useSession((s) => s.accessMode)
  const accessError = useSession((s) => s.accessError)
  const status = useSession((s) => s.status)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  useEffect(() => {
    void restoreSession()
  }, [])
  useEffect(() => {
    if (status === 'anonymous' && accessMode === 'account') window.history.replaceState(null, '', '/login')
    else if (status === 'authenticated' && window.location.pathname === '/login')
      window.history.replaceState(null, '', '/')
  }, [status, accessMode])
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fields = new FormData(form)
    setBusy(true)
    setError('')
    try {
      await login(String(fields.get('username')), String(fields.get('password')))
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tidak dapat masuk.')
    } finally {
      setBusy(false)
    }
  }
  if (status === 'authenticated') return children
  if (status === 'restoring') {
    return (
      <main className="bg-map-bg text-ink flex min-h-dvh flex-col items-center justify-center gap-3 p-4">
        <Loader2 className="text-brand size-8 animate-spin" strokeWidth={2} aria-hidden />
        <p role="status" className="text-ink-2 text-sm">
          {copy.common.loading}
        </p>
      </main>
    )
  }
  return (
    <main className="bg-map-bg text-ink flex min-h-dvh items-center justify-center p-4">
      <section
        className="rounded-panel bg-surface w-full max-w-sm space-y-4 p-6 shadow-sm"
        aria-labelledby="login-title"
      >
        <h1 id="login-title" className="text-xl font-semibold">
          <Brand />
        </h1>
        <p className="text-ink-2 text-base">Masuk untuk mengakses data workspace kamu.</p>
        {accessMode === 'client' ? (
          <div className="space-y-4"><p role="alert">{accessError || 'Akses client belum tersedia.'}</p><button type="button" className={`rounded-ctl border-line h-11 border px-4 ${focusRing}`} onClick={() => void restoreSession()}>Coba lagi</button></div>
        ) : (
          <form
            onSubmit={(e) => {
              void submit(e)
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="username" className="mb-1 block text-sm">
                {copy.auth.username}
              </label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                required
                maxLength={80}
                className={`border-line rounded-ctl h-11 w-full border px-3 text-lg sm:text-base ${focusRing}`}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm">
                {copy.auth.password}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  className={`border-line rounded-ctl h-11 w-full border pr-12 pl-3 text-lg sm:text-base ${focusRing}`}
                />
                <button
                  type="button"
                  aria-label={show ? copy.auth.hidePassword : copy.auth.showPassword}
                  aria-pressed={show}
                  onClick={() => setShow((v) => !v)}
                  className={`absolute top-0 right-0 flex size-11 items-center justify-center ${focusRing}`}
                >
                  {show ? (
                    <EyeOff className="size-4.5" strokeWidth={2} aria-hidden />
                  ) : (
                    <Eye className="size-4.5" strokeWidth={2} aria-hidden />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="text-ink text-sm">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className={`bg-brand text-surface h-11 w-full rounded-full px-4 font-semibold disabled:opacity-60 ${focusRing}`}
            >
              {busy ? 'Memproses…' : 'Masuk'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
export function SessionControl() {
  const accessMode = useSession((s) => s.accessMode)
  const principal = useSession((s) => s.principal)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const generation = useSession((s) => s.generation)
  const clients = useQuery({
    queryKey: ['access-clients', principal?.client_id, generation],
    queryFn: async () =>
      z
        .object({
          data: z.array(
            z.object({
              id: z.string().uuid(),
              slug: z.string(),
              name: z.string(),
              enabled: z.boolean(),
            }),
          ),
        })
        .parse(await sessionRequest('/auth/clients', 'GET'))
        .data.filter((c) => c.enabled),
    staleTime: 300000,
    enabled: accessMode === 'account',
  })
  if (accessMode === 'client') return null
  return (
    <div className="border-line flex flex-wrap items-center gap-2 border-t pt-2 text-xs">
      <span className="text-ink-2 min-w-0 flex-1 break-words">
        {principal?.username} · {principal?.client_slug}
      </span>
      {clients.data && clients.data.length > 1 && (
        <div className="w-full">
          <label htmlFor="workspace" className="mb-1 block text-xs">
            {copy.auth.workspace}
          </label>
          <SearchableSelect
            id="workspace"
            value={principal?.client_slug ?? ''}
            disabled={busy}
            options={clients.data.map((c) => ({
              value: c.slug,
              label: c.name || c.slug,
            }))}
            onChange={(val) => {
              setBusy(true)
              setError('')
              void switchClient(val)
                .catch((err) =>
                  setError(
                    err instanceof Error ? err.message : copy.auth.workspaceSwitchFail,
                  ),
                )
                .finally(() => setBusy(false))
            }}
            searchPlaceholder={copy.auth.workspaceSearch}
            emptyText={copy.auth.workspaceEmpty}
            ariaLabel={copy.auth.workspace}
          />
        </div>
      )}
      {clients.isError && (
        <p role="alert" className="w-full text-xs">
          {copy.auth.workspaceListFail}
        </p>
      )}
      <button
        type="button"
        aria-label={copy.auth.logout}
        disabled={busy}
        className={`rounded-full flex size-10 items-center justify-center ${focusRing}`}
        onClick={() => {
          setBusy(true)
          setError('')
          void logout()
            .catch((err) => setError(err instanceof Error ? err.message : 'Gagal keluar'))
            .finally(() => setBusy(false))
        }}
      >
        <LogOut className="size-4" strokeWidth={2} aria-hidden />
      </button>
      {error && (
        <p role="alert" className="w-full">
          {error}
        </p>
      )}
    </div>
  )
}
