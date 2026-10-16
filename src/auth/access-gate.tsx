import { Brand } from '@/components/common/brand'
import { BootLoading } from '@/components/map/map-soft-loading'
import { copy } from '@/copy/id'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { login, restoreSession, useSession } from './session'
import { focusRing } from '@/components/common/focus-ring'
import { useUiStore } from '@/store/ui'

export function AccessGate({ children }: { children: ReactNode }) {
  const accessMode = useSession((s) => s.accessMode)
  const accessError = useSession((s) => s.accessError)
  const status = useSession((s) => s.status)
  const bootDone = useUiStore((s) => s.bootDone)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  useEffect(() => {
    void restoreSession()
  }, [])
  useEffect(() => {
    if (status === 'anonymous' && accessMode === 'account')
      window.history.replaceState(null, '', '/login')
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
      setError(err instanceof Error ? err.message : copy.auth.loginFail)
    } finally {
      setBusy(false)
    }
  }

  // Overlay tetap di pohon yang sama: restore → authenticated → mapReady.
  const showBoot = status === 'restoring' || (status === 'authenticated' && !bootDone)

  const body =
    status === 'authenticated' ? (
      children
    ) : status === 'restoring' ? null : (
      <main className="bg-map-bg text-ink flex min-h-dvh items-center justify-center p-4">
        <section
          className="rounded-panel bg-surface w-full max-w-sm space-y-6 p-6 shadow-sm"
          aria-labelledby="login-title"
        >
          <header className="space-y-1">
            <h1 id="login-title" className="text-xl leading-8 font-semibold">
              <Brand />
            </h1>
            <p className="text-ink-2 text-sm leading-5">{copy.auth.loginLead}</p>
          </header>
          {accessMode === 'client' ? (
            <div className="space-y-4">
              <p role="alert" className="text-sm leading-5">
                {accessError || copy.auth.clientUnavailable}
              </p>
              <button
                type="button"
                className={`rounded-card border-line h-11 border px-4 text-sm leading-5 ${focusRing}`}
                onClick={() => void restoreSession()}
              >
                {copy.auth.retry}
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                void submit(e)
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="username" className="mb-1 block text-sm leading-5">
                  {copy.auth.username}
                </label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  maxLength={80}
                  className={`border-line rounded-card h-11 w-full border px-3 text-sm leading-5 ${focusRing}`}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm leading-5">
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
                    className={`border-line rounded-card h-11 w-full border pr-12 pl-3 text-sm leading-5 ${focusRing}`}
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
                <p role="alert" className="text-ink text-sm leading-5">
                  {error}
                </p>
              )}
              <button
                disabled={busy}
                className={`bg-brand text-surface rounded-card h-11 w-full px-4 text-sm leading-5 font-semibold disabled:opacity-60 ${focusRing}`}
              >
                {busy ? copy.auth.submitting : copy.auth.submit}
              </button>
            </form>
          )}
        </section>
      </main>
    )

  return (
    <>
      {body}
      {showBoot ? <BootLoading /> : null}
    </>
  )
}
