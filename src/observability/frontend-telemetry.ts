import { useEffect } from 'react'
import { useSession } from '@/auth/session'
import { timeoutSignal } from '@/lib/abort'
import { useTelemetryStatus, type TelemetryStatus } from './telemetry-status'

const SESSION_KEY = 'pantau-mala.telemetry-session'
const SESSION_MS = 30 * 60_000
const FIRST_FLUSH_MS = 1_000
const FLUSH_MS = 10_000
const MAX_BATCH = 20
const MAX_PENDING = 40
const MAX_ATTEMPTS = 3

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
    return randomId()
  }
  const id = randomId()
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

function randomId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
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

function hasPrivacySignal() {
  if (typeof navigator === 'undefined') return false
  return (
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  )
}

export function startFrontendTelemetry() {
  const privacyMode = hasPrivacySignal()
  if (typeof crypto.getRandomValues !== 'function') {
    useTelemetryStatus.setState({ status: 'unsupported' })
    return () => {}
  }
  useTelemetryStatus.setState({ status: privacyMode ? 'privacy' : 'idle' })
  let currentSession = privacyMode ? '' : sessionId()
  let sessionExpires = Date.now() + SESSION_MS
  const pending: { event: Event; attempts: number }[] = []
  let timer: number | undefined
  let stopped = false
  let disabled = false
  let inFlight = false
  let cooldown = 0
  let firstFlush = true
  let period = Date.now()
  let budget = 0

  const setStatus = (status: TelemetryStatus) => {
    if (!stopped) useTelemetryStatus.setState({ status })
  }

  const retry = (batch: typeof pending) => {
    if (stopped) return
    pending.unshift(...batch.filter((entry) => entry.attempts < MAX_ATTEMPTS))
    pending.length = Math.min(pending.length, MAX_PENDING)
    setStatus(pending.length ? 'retrying' : 'unavailable')
  }

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
    const batch = pending.splice(0, MAX_BATCH)
    const events = batch.map((entry) => {
      entry.attempts++
      return entry.event
    })
    firstFlush = false
    inFlight = true
    setStatus('sending')
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
      signal: timeoutSignal(5000),
      body: JSON.stringify({ events }),
    })
      .then((response) => {
        if ([400, 401, 403, 404, 405, 413, 415].includes(response.status)) {
          disabled = true
          pending.length = 0
          setStatus('rejected')
        } else if (response.status === 202) {
          setStatus('accepted')
        } else if (response.status !== 202) {
          retry(batch)
          const seconds = Number(response.headers.get('Retry-After')) || 30
          cooldown = Date.now() + Math.min(3600, Math.max(30, seconds)) * 1000
        }
      })
      .catch(() => {
        retry(batch)
        cooldown = Date.now() + 30_000
      })
      .finally(() => {
        inFlight = false
        schedule()
      })
  }

  const track = (event: Omit<Event, 'id' | 'session_id' | 'path'>, id = randomId()) => {
    if (stopped || disabled || pending.length >= MAX_PENDING) return
    if (Date.now() - period >= 60_000) {
      period = Date.now()
      budget = 0
    }
    if (budget >= 60) return
    budget++
    if (!privacyMode && Date.now() >= sessionExpires) {
      currentSession = sessionId()
      sessionExpires = Date.now() + SESSION_MS
    }
    pending.push({
      event: {
        ...event,
        id,
        session_id: currentSession,
        path: pagePath(),
      },
      attempts: 0,
    })
    setStatus('queued')
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
  const edgeID = document.querySelector<HTMLMetaElement>(
    'meta[name="pantau-page-view"]',
  )?.content
  const initialView = window.setTimeout(
    () =>
      track(
        { type: 'page_view', referrer: privacyMode ? '' : referrerOrigin() },
        edgeID && /^[0-9a-f-]{36}$/.test(edgeID) ? edgeID : randomId(),
      ),
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
