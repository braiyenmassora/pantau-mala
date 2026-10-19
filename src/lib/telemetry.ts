import { useSyncExternalStore } from 'react'

export const TELEMETRY_SESSION_KEY = 'pantau-mala.telemetry-session'
export const TELEMETRY_SESSION_MS = 30 * 60_000
export const TELEMETRY_URL = '/api/v1/telemetry'

const UUID_RE = /^[0-9a-f-]{36}$/i

export type TelemetryStatus =
  'privacy' | 'queued' | 'sending' | 'accepted' | 'retrying' | 'unavailable' | 'rejected'

export type TelemetryEvent = {
  id: string
  session_id: string
  type: 'page_view' | 'error'
  path: string
  referrer: string
  /** Kode aman saja — bukan message/stack. */
  code?: string
}

type StoredSession = { id: string; at: number }

let status: TelemetryStatus = 'queued'
const listeners = new Set<() => void>()
let started = false
let memorySessionId = ''

function setStatus(next: TelemetryStatus) {
  if (status === next) return
  status = next
  for (const fn of listeners) fn()
}

export function getTelemetryStatus(): TelemetryStatus {
  return status
}

export function subscribeTelemetryStatus(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useTelemetryStatus(): TelemetryStatus {
  return useSyncExternalStore(
    subscribeTelemetryStatus,
    getTelemetryStatus,
    () => 'queued' as TelemetryStatus,
  )
}

export function isPrivacyMode(
  nav: Navigator = typeof navigator !== 'undefined' ? navigator : ({} as Navigator),
): boolean {
  return (
    nav.doNotTrack === '1' ||
    (nav as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  )
}

/** Pathname saja — tanpa query/fragment. */
export function telemetryPath(loc: Location = window.location): string {
  return loc.pathname || '/'
}

export function pageViewEventId(doc: Document = document): string {
  const edgeId = doc.querySelector<HTMLMetaElement>(
    'meta[name="pantau-page-view"]',
  )?.content
  if (edgeId && UUID_RE.test(edgeId)) return edgeId
  return crypto.randomUUID()
}

export function telemetrySessionId(privacy: boolean): string {
  if (privacy) return ''
  const now = Date.now()
  try {
    const raw = sessionStorage.getItem(TELEMETRY_SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession
      if (
        typeof parsed?.id === 'string' &&
        UUID_RE.test(parsed.id) &&
        typeof parsed.at === 'number' &&
        now - parsed.at < TELEMETRY_SESSION_MS
      ) {
        sessionStorage.setItem(
          TELEMETRY_SESSION_KEY,
          JSON.stringify({ id: parsed.id, at: now }),
        )
        return parsed.id
      }
    }
    const id = crypto.randomUUID()
    sessionStorage.setItem(TELEMETRY_SESSION_KEY, JSON.stringify({ id, at: now }))
    return id
  } catch {
    if (!memorySessionId) memorySessionId = crypto.randomUUID()
    return memorySessionId
  }
}

function buildEvent(
  type: TelemetryEvent['type'],
  privacy: boolean,
  code?: string,
): TelemetryEvent {
  const event: TelemetryEvent = {
    id: type === 'page_view' ? pageViewEventId() : crypto.randomUUID(),
    session_id: telemetrySessionId(privacy),
    type,
    path: telemetryPath(),
    referrer: privacy ? '' : document.referrer || '',
  }
  if (code) event.code = code
  return event
}

async function postEvents(events: TelemetryEvent[]): Promise<Response> {
  return fetch(TELEMETRY_URL, {
    method: 'POST',
    mode: 'same-origin',
    credentials: 'same-origin',
    cache: 'no-store',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'respond-async',
      'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
    },
    body: JSON.stringify({ events }),
  })
}

function classifyHttp(statusCode: number): TelemetryStatus {
  if (statusCode === 202) return 'accepted'
  if (statusCode === 404 || statusCode === 501 || statusCode === 503) return 'unavailable'
  return 'rejected'
}

/** Kirim batch; gagal tidak melempar ke pemanggil (peta tetap jalan). */
export async function sendTelemetry(events: TelemetryEvent[], privacy: boolean) {
  if (!privacy) setStatus('sending')
  try {
    const res = await postEvents(events)
    if (!privacy) setStatus(classifyHttp(res.status))
    if (res.status === 202) return
  } catch {
    if (!privacy) setStatus('retrying')
    try {
      const res = await postEvents(events)
      if (!privacy) setStatus(classifyHttp(res.status))
    } catch {
      if (!privacy) setStatus('unavailable')
    }
  }
}

/** Error aplikasi — hanya kode aman, tanpa message/stack. */
export function reportTelemetryError(code: string) {
  try {
    const privacy = isPrivacyMode()
    void sendTelemetry([buildEvent('error', privacy, code)], privacy)
  } catch {
    // jangan ubah error telemetry jadi error aplikasi
  }
}

/** Boot sekali: page_view (+ mode privasi tanpa hard-abort). */
export function startTelemetry() {
  if (started || typeof window === 'undefined') return
  started = true
  try {
    const privacy = isPrivacyMode()
    setStatus(privacy ? 'privacy' : 'queued')
    void sendTelemetry([buildEvent('page_view', privacy)], privacy)
  } catch {
    setStatus('unavailable')
  }
}

/** Test-only. */
export function resetTelemetryForTests() {
  started = false
  memorySessionId = ''
  status = 'queued'
}
