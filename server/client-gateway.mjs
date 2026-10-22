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
    /^\/api\/v1\/(regions(?:\/[0-9]{2}\.[0-9]{2}(?:\/(history|river-discharge))?)?|region-catalog|hotspots(?:\.geojson)?|data-status|summary|earthquakes|weather\/(bmkg|windy)|nearby|villages|hotspot-reports(?:\/(?:counts(?:\/by-region)?|total|photo|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))?)$/
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
    const isTelemetry = url.pathname === '/api/v1/telemetry'
    // Satu-satunya tulis selain telemetry: buat laporan warga + minta URL upload foto.
    const isReportWrite =
      request.method === 'POST' &&
      (url.pathname === '/api/v1/hotspot-reports' ||
        url.pathname === '/api/v1/hotspot-reports/photo')
    if (
      isTelemetry || isReportWrite ? request.method !== 'POST' : request.method !== 'GET'
    )
      return reply(405, { error: 'Read-only frontend' })
    if (request.headers.has('authorization') || request.headers.has('x-client-id'))
      return reply(400, { error: 'Client identity is server configured' })
    if (request.headers.get('origin') && request.headers.get('origin') !== url.origin)
      return reply(403, { error: 'Origin denied' })
    if (request.headers.get('sec-fetch-site') === 'cross-site')
      return reply(403, { error: 'Origin denied' })
    if (url.pathname.startsWith('/auth/'))
      return reply(403, { error: 'Management is available in the Go console' })
    if (
      url.pathname !== '/frontend/session' &&
      !isTelemetry &&
      !allowed.test(url.pathname)
    )
      return reply(404, { error: 'Unknown data route' })
    if (isTelemetry && url.search)
      return reply(400, { error: 'Unsupported query parameter' })
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
      'region_code',
      'point_lat',
      'point_lon',
      'points',
    ])
    for (const key of url.searchParams.keys())
      if (!queryNames.has(key))
        return reply(400, { error: 'Unsupported query parameter' })
    try {
      // Telemetry: body dari browser; UA/Origin/geo dari gateway (bukan field body).
      if (isTelemetry) {
        const prefer = request.headers.get('prefer')
        const transport = request.headers.get('x-pantau-telemetry-transport')
        const headers = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
        if (prefer) headers.Prefer = prefer
        if (transport) headers['X-Pantau-Telemetry-Transport'] = transport
        const ua = request.headers.get('user-agent')
        if (ua) headers['User-Agent'] = ua
        const reqOrigin = request.headers.get('origin')
        if (reqOrigin) headers.Origin = reqOrigin
        const referer = request.headers.get('referer')
        if (referer) headers.Referer = referer
        // Geo hanya dari CF Worker (request.cf); buang header geo spoof dari browser.
        const cf = request.cf
        if (cf && typeof cf === 'object') {
          const country = cf.country != null ? String(cf.country).trim() : ''
          const region = String(cf.region || cf.regionCode || '').trim()
          const city = cf.city != null ? String(cf.city).trim() : ''
          if (country || region || city) {
            headers['X-Pantau-Geo-Source'] = 'cloudflare'
            if (country) headers['X-Pantau-Geo-Country'] = encodeURIComponent(country)
            if (region) headers['X-Pantau-Geo-Region'] = encodeURIComponent(region)
            if (city) headers['X-Pantau-Geo-City'] = encodeURIComponent(city)
          }
        }
        const upstreamRes = await fetcher(new URL('/api/v1/telemetry', origin), {
          method: 'POST',
          headers,
          body: await request.arrayBuffer(),
          redirect: 'manual',
          signal: AbortSignal.timeout(20000),
        })
        // Jangan bocorkan detail upstream; 202 = antrean, selain itu status generik.
        if (upstreamRes.status === 202) {
          return new Response(null, {
            status: 202,
            headers: {
              'Cache-Control': 'no-store',
              'X-Content-Type-Options': 'nosniff',
            },
          })
        }
        return reply(
          upstreamRes.status === 429
            ? 429
            : upstreamRes.status >= 500
              ? 502
              : upstreamRes.status === 401 || upstreamRes.status === 403
                ? 502
                : upstreamRes.status,
          { error: 'Telemetry unavailable' },
        )
      }
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
      // Laporan warga: teruskan body JSON + Origin/IP agar rate limit BE per-pengirim jalan.
      if (isReportWrite) {
        const headers = {
          Accept: 'application/json',
          'Content-Type': request.headers.get('content-type') || 'application/json',
          Authorization: `Bearer ${token}`,
        }
        const reqOrigin = request.headers.get('origin')
        if (reqOrigin) headers.Origin = reqOrigin
        const forwardedFor =
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for')
        if (forwardedFor) headers['X-Forwarded-For'] = forwardedFor
        const created = await fetcher(new URL(url.pathname, origin), {
          method: 'POST',
          headers,
          body: await request.arrayBuffer(),
          redirect: 'manual',
          signal: AbortSignal.timeout(20000),
        })
        if (!created.ok)
          return reply(
            created.status === 429 ? 429 : created.status >= 500 ? 502 : created.status,
            { error: 'Data unavailable' },
          )
        const createdBody = await created.arrayBuffer()
        return new Response(createdBody, {
          status: created.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      }
      const data = await upstream(url.pathname + url.search)
      if (!data.ok)
        return reply(data.status === 429 ? 429 : data.status >= 500 ? 502 : data.status, {
          error: 'Data unavailable',
        })
      // Baca body di dalam try: AbortSignal.timeout bisa putus saat stream masih jalan.
      const body = await data.arrayBuffer()
      return new Response(body, {
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
