export const TELEMETRY_SESSION_KEY = 'pantau-mala.telemetry-session'
export const TELEMETRY_SESSION_MS = 30 * 60_000
export const TELEMETRY_URL = '/api/v1/telemetry'

const UUID_RE = /^[0-9a-f-]{36}$/i

export type TelemetryStatus =
  'privacy' | 'queued' | 'sending' | 'accepted' | 'retrying' | 'unavailable' | 'rejected'

export type TelemetryIssue = 'runtime_error' | 'unhandled_rejection' | 'api_error'

export type TelemetryEvent = {
  id: string
  session_id: string
  type: 'page_view' | 'error'
  path: string
  referrer: string
  /** Field kontrak BE (tampil sebagai Sumber di console). */
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  /** Allowlist BE — bukan message/stack. */
  issue?: TelemetryIssue
  status?: number
}

const UTM_MAX = 64

function sanitizeUtm(value: string | null): string {
  const v = (value || '').trim()
  if (!v || v.length > UTM_MAX) return ''
  for (let i = 0; i < v.length; i++) {
    const c = v.charCodeAt(i)
    if (c < 32 || c === 127) return ''
  }
  return v
}

/** Ekstrak sumber kampanye dari query — bukan seluruh search string. */
export function telemetrySumber(
  loc: Location = typeof window !== 'undefined'
    ? window.location
    : ({ search: '' } as Location),
): Pick<TelemetryEvent, 'utm_source' | 'utm_medium' | 'utm_campaign'> {
  const q = new URLSearchParams(loc.search || '')
  const out: Pick<TelemetryEvent, 'utm_source' | 'utm_medium' | 'utm_campaign'> =
    {}
  const source = sanitizeUtm(q.get('utm_source'))
  const medium = sanitizeUtm(q.get('utm_medium'))
  const campaign = sanitizeUtm(q.get('utm_campaign'))
  if (source) out.utm_source = source
  if (medium) out.utm_medium = medium
  if (campaign) out.utm_campaign = campaign
  return out
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

type BuildOpts = {
  /** Navigasi dalam SPA — path baru, tanpa referrer/UTM eksternal. */
  spa?: boolean
}

let lastTrackedPath = ''
let historyPatched = false
const nativePushState = history.pushState.bind(history)
const nativeReplaceState = history.replaceState.bind(history)

function buildEvent(
  type: TelemetryEvent['type'],
  privacy: boolean,
  issue?: TelemetryIssue,
  status?: number,
  opts?: BuildOpts,
): TelemetryEvent {
  const spa = Boolean(opts?.spa)
  const event: TelemetryEvent = {
    id:
      type === 'page_view'
        ? spa
          ? crypto.randomUUID()
          : pageViewEventId()
        : crypto.randomUUID(),
    session_id: telemetrySessionId(privacy),
    type,
    path: telemetryPath(),
    referrer: privacy || spa ? '' : document.referrer || '',
  }
  if (!privacy && !spa) Object.assign(event, telemetrySumber())
  if (issue) event.issue = issue
  if (typeof status === 'number') event.status = status
  return event
}

function trackPathChange(privacy: boolean, spa: boolean) {
  const path = telemetryPath()
  if (path === lastTrackedPath) return
  lastTrackedPath = path
  void sendTelemetry([buildEvent('page_view', privacy, undefined, undefined, { spa })], privacy)
}

function patchHistory(privacy: boolean) {
  if (historyPatched || typeof window === 'undefined') return
  historyPatched = true
  history.pushState = function pushState(...args: Parameters<History['pushState']>) {
    const ret = nativePushState(...args)
    trackPathChange(privacy, true)
    return ret
  }
  history.replaceState = function replaceState(
    ...args: Parameters<History['replaceState']>
  ) {
    const ret = nativeReplaceState(...args)
    trackPathChange(privacy, true)
    return ret
  }
  window.addEventListener('popstate', () => trackPathChange(privacy, true))
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

/** Error aplikasi — issue allowlist saja, tanpa message/stack. */
export function reportTelemetryError(
  issue: TelemetryIssue = 'runtime_error',
  status?: number,
) {
  try {
    const privacy = isPrivacyMode()
    void sendTelemetry([buildEvent('error', privacy, issue, status)], privacy)
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
    lastTrackedPath = telemetryPath()
    void sendTelemetry([buildEvent('page_view', privacy)], privacy)
    patchHistory(privacy)
  } catch {
    setStatus('unavailable')
  }
}

/** Test-only. */
export function resetTelemetryForTests() {
  started = false
  memorySessionId = ''
  status = 'queued'
  lastTrackedPath = ''
  if (historyPatched && typeof history !== 'undefined') {
    history.pushState = nativePushState
    history.replaceState = nativeReplaceState
    historyPatched = false
  }
}
