import { useEffect } from 'react'
import { useSession } from '@/auth/session'

const SESSION_KEY = 'pantau-mala.telemetry-session'
const SESSION_MS = 30 * 60_000
const FIRST_FLUSH_MS = 1_000
const FLUSH_MS = 10_000
const MAX_BATCH = 20

type Event = {
  id: string
  session_id: string
  type: 'page_view' | 'error'
  path: string
  issue?: 'runtime_error' | 'unhandled_rejection' | 'api_error'
  status?: number
  referrer?: string
}

let reportApiError: ((status: number) => void) | undefined

export function recordFrontendApiError(status: number) {
  if (status >= 400 && status <= 599) reportApiError?.(status)
}

function sessionId() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const saved = raw ? (JSON.parse(raw) as { id?: string; expires?: number }) : null
    if (
      saved?.expires &&
      saved.expires > Date.now() &&
      saved.id &&
      /^[0-9a-f-]{36}$/.test(saved.id)
    ) {
      return saved.id
    }
  } catch {
    return crypto.randomUUID()
  }
  const id = crypto.randomUUID()
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id, expires: Date.now() + SESSION_MS }),
    )
  } catch {
    return id
  }
  return id
}

function referrerOrigin() {
  try {
    return new URL(document.referrer).origin
  } catch {
    return ''
  }
}

function pagePath() {
  const path = location.pathname
  return path.length <= 256 && /^\/(?!\/)[a-zA-Z0-9/_.-]*$/.test(path) ? path : '/'
}

export function startFrontendTelemetry() {
  if (
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl ||
    !crypto.randomUUID
  ) {
    return () => {}
  }
  let currentSession = sessionId()
  let sessionExpires = Date.now() + SESSION_MS
  const pending: Event[] = []
  let timer: number | undefined
  let stopped = false
  let disabled = false
  let inFlight = false
  let cooldown = 0
  let firstFlush = true
  let period = Date.now()
  let budget = 0

  const schedule = () => {
    if (stopped || disabled || timer !== undefined || !pending.length) return
    timer = window.setTimeout(
      () => {
        timer = undefined
        flush()
      },
      Math.max(firstFlush ? FIRST_FLUSH_MS : FLUSH_MS, cooldown - Date.now()),
    )
  }

  const flush = () => {
    if (disabled || inFlight || Date.now() < cooldown || !pending.length) return
    const events = pending.splice(0, MAX_BATCH)
    firstFlush = false
    inFlight = true
    void fetch('/api/v1/telemetry', {
      method: 'POST',
      mode: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'respond-async',
        'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
      },
      credentials: 'same-origin',
      cache: 'no-store',
      keepalive: true,
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ events }),
    })
      .then((response) => {
        if ([400, 401, 403, 404, 405, 413, 415].includes(response.status)) {
          disabled = true
          pending.length = 0
        } else if (response.status !== 202) {
          pending.unshift(...events)
          const seconds = Number(response.headers.get('Retry-After')) || 30
          cooldown = Date.now() + Math.min(3600, Math.max(30, seconds)) * 1000
        }
      })
      .catch(() => {
        pending.unshift(...events)
        cooldown = Date.now() + 30_000
      })
      .finally(() => {
        inFlight = false
        schedule()
      })
  }

  const track = (event: Omit<Event, 'id' | 'session_id' | 'path'>) => {
    if (stopped || disabled || pending.length >= 40) return
    if (Date.now() - period >= 60_000) {
      period = Date.now()
      budget = 0
    }
    if (budget >= 60) return
    budget++
    if (Date.now() >= sessionExpires) {
      currentSession = sessionId()
      sessionExpires = Date.now() + SESSION_MS
    }
    pending.push({
      ...event,
      id: crypto.randomUUID(),
      session_id: currentSession,
      path: pagePath(),
    })
    schedule()
  }

  const onError = () => track({ type: 'error', issue: 'runtime_error' })
  const onRejection = () => track({ type: 'error', issue: 'unhandled_rejection' })
  const onHide = () => {
    if (document.hidden) flush()
  }
  const apiError = (status: number) =>
    track({ type: 'error', issue: 'api_error', status })
  reportApiError = apiError
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', onHide)
  const initialView = window.setTimeout(
    () => track({ type: 'page_view', referrer: referrerOrigin() }),
    0,
  )

  return () => {
    stopped = true
    window.clearTimeout(initialView)
    if (timer !== undefined) window.clearTimeout(timer)
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
    window.removeEventListener('pagehide', flush)
    document.removeEventListener('visibilitychange', onHide)
    if (reportApiError === apiError) reportApiError = undefined
    flush()
  }
}

export function useFrontendTelemetry() {
  const enabled = useSession(
    (state) => state.status === 'authenticated' && state.accessMode === 'client',
  )
  const clientID = useSession((state) => state.principal?.client_id)
  useEffect(() => {
    if (enabled) return startFrontendTelemetry()
  }, [enabled, clientID])
}
