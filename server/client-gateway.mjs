// Server-only: never import this module from src or expose these env names via VITE_.
export function createClientGateway(env, fetcher = fetch) {
  const mode = env.FE_ACCESS_MODE || 'account'
  if (!['account', 'client'].includes(mode)) throw new Error('Invalid FE_ACCESS_MODE')
  if (mode === 'account') return async () => null
  const token = env.PANTAU_API_KEY?.trim()
  const client = env.PANTAU_CLIENT_SLUG?.trim()
  const origin = new URL(env.PANTAU_API_ORIGIN || 'http://127.0.0.1:8080')
  if (!token || !client)
    throw new Error('Client mode requires PANTAU_API_KEY and PANTAU_CLIENT_SLUG')
  if (
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== '/' ||
    !(
      origin.protocol === 'https:' ||
      (origin.protocol === 'http:' &&
        ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname))
    )
  )
    throw new Error('API origin must be HTTPS or loopback HTTP without credentials/path')
  const reply = (status, body) =>
    Response.json(body, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frontend-Access': 'client',
      },
    })
  const allowed =
    /^\/api\/v1\/(regions(?:\/[0-9]{2}\.[0-9]{2}(?:\/(history|river-discharge))?)?|region-catalog|hotspots(?:\.geojson)?|data-status|summary|earthquakes|weather\/(bmkg|windy)|nearby|villages)$/
  async function upstream(path) {
    return fetcher(new URL(path, origin), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    })
  }
  return async (request) => {
    const url = new URL(request.url)
    if (
      !url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/auth/') &&
      url.pathname !== '/frontend/session'
    )
      return null
    if (request.method !== 'GET') return reply(405, { error: 'Read-only frontend' })
    if (request.headers.has('authorization') || request.headers.has('x-client-id'))
      return reply(400, { error: 'Client identity is server configured' })
    if (request.headers.get('origin') && request.headers.get('origin') !== url.origin)
      return reply(403, { error: 'Origin denied' })
    if (request.headers.get('sec-fetch-site') === 'cross-site')
      return reply(403, { error: 'Origin denied' })
    if (url.pathname.startsWith('/auth/'))
      return reply(403, { error: 'Management is available in the Go console' })
    if (url.pathname !== '/frontend/session' && !allowed.test(url.pathname))
      return reply(404, { error: 'Unknown data route' })
    const queryNames = new Set([
      'limit',
      'offset',
      'bbox',
      'kategori',
      'kode_wilayah',
      'from',
      'to',
      'days',
      'kind',
      'adm4',
      'start',
      'end',
      'lat',
      'lon',
      'radius_km',
      'q',
    ])
    for (const key of url.searchParams.keys())
      if (!queryNames.has(key))
        return reply(400, { error: 'Unsupported query parameter' })
    try {
      // Key tetap dari env. /auth/me hanya untuk session bootstrap (bukan tiap data request).
      if (url.pathname === '/frontend/session') {
        const identity = await upstream('/auth/me')
        if (!identity.ok)
          return reply(identity.status === 429 ? 429 : 503, {
            error: 'Client access unavailable',
          })
        const raw = await identity.json()
        const principal = raw.data || raw.principal || raw
        if (
          principal.kind !== 'key' ||
          principal.scope !== 'data:read' ||
          principal.client_slug !== client
        )
          return reply(503, { error: 'Client access configuration mismatch' })
        return reply(200, {
          mode: 'client',
          principal: {
            client_id: principal.client_id,
            client_slug: principal.client_slug,
            username: '',
            role: 'reader',
            kind: 'key',
            scope: 'data:read',
          },
        })
      }
      const data = await upstream(url.pathname + url.search)
      if (!data.ok)
        return reply(data.status === 429 ? 429 : data.status >= 500 ? 502 : data.status, {
          error: 'Data unavailable',
        })
      return new Response(data.body, {
        status: data.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    } catch {
      return reply(503, { error: 'Data service unavailable' })
    }
  }
}
