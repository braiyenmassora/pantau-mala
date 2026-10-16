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
  const withLifecycle = (response, upstreamResponse) => {
    for (const name of ['X-Pantau-Contract-Revision', 'Deprecation', 'Sunset', 'Link']) {
      const value = upstreamResponse.headers.get(name)
      if (value && value.length <= 2048) response.headers.set(name, value)
    }
    return response
  }
  const allowed =
    /^\/api\/v1\/(regions(?:\/[0-9]{2}\.[0-9]{2}(?:\/(history|river-discharge))?)?|region-catalog|hotspots(?:\.geojson)?|data-status|summary|earthquakes|weather\/(bmkg|windy)|nearby|villages|indicators\/soil-moisture|external-events\/nasa-eonet|providers\/(registry|provenance)|telemetry)$/
  function upstreamHeaders(request, metadata) {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent':
        request.headers.get('user-agent')?.trim().slice(0, 512) ||
        (metadata.runtime === 'cloudflare'
          ? 'pantau-mala-worker/1.0'
          : 'pantau-mala-gateway/1.0'),
    }
    const originHeader = sanitizeOriginHeader(request.headers.get('origin'))
    if (originHeader) headers.Origin = originHeader
    const refererHeader = sanitizeOriginHeader(request.headers.get('referer'))
    if (refererHeader) headers.Referer = `${refererHeader}/`
    const clientIP = safeClientIP(metadata.clientIP)
    if (clientIP) headers['X-Forwarded-For'] = clientIP
    if (metadata.runtime === 'cloudflare') {
      headers['X-Pantau-Geo-Source'] = 'cloudflare'
      const country = safeGeoHeader(metadata.clientCountry, 64)
      const region = safeGeoHeader(metadata.clientRegion, 128)
      const city = safeGeoHeader(metadata.clientCity, 128)
      if (country) headers['X-Pantau-Geo-Country'] = country
      if (region) headers['X-Pantau-Geo-Region'] = region
      if (city) headers['X-Pantau-Geo-City'] = city
    }
    for (const name of ['sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform']) {
      const value = request.headers.get(name)?.trim()
      if (value && value.length <= 256) headers[name] = value
    }
    return headers
  }
  async function upstream(path, headers, options = {}) {
    return fetcher(new URL(path, origin), {
      method: options.method || 'GET',
      body: options.body,
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(options.timeoutMs || 20000),
    })
  }
  return async (request, metadata = {}) => {
    const url = new URL(request.url)
    if (
      !url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/auth/') &&
      url.pathname !== '/frontend/session'
    )
      return null
    if (url.pathname === '/api/v1/telemetry') {
      if (request.method !== 'POST')
        return reply(405, { error: 'Telemetry requires POST' })
      if (
        request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json'
      )
        return reply(415, { error: 'Telemetry requires application/json' })
      const prefer = (request.headers.get('prefer') || '')
        .toLowerCase()
        .split(',')
        .map((value) => value.trim())
      const transport = (request.headers.get('x-pantau-telemetry-transport') || '')
        .toLowerCase()
        .trim()
      if (!prefer.includes('respond-async') || transport !== 'fetch-keepalive')
        return reply(400, {
          error:
            'Kontrak telemetry async wajib: Prefer: respond-async dan X-Pantau-Telemetry-Transport: fetch-keepalive',
        })
    } else if (request.method !== 'GET') {
      return reply(405, { error: 'Read-only frontend' })
    }
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
      'status',
      'feed',
    ])
    for (const key of url.searchParams.keys())
      if (!queryNames.has(key))
        return reply(400, { error: 'Unsupported query parameter' })
    const headers = upstreamHeaders(request, metadata)
    try {
      let telemetryBody
      if (url.pathname === '/api/v1/telemetry') {
        if (url.search)
          return reply(400, { error: 'Telemetry does not accept query parameters' })
        try {
          telemetryBody = await readTelemetryBody(request)
        } catch {
          return reply(413, { error: 'Telemetry payload exceeds 16 KiB' })
        }
        headers.Origin = url.origin
        if (metadata.viewSource === 'edge') headers['X-Pantau-Telemetry-Source'] = 'edge'
      }
      // Validate fixed identity for every request, including revocation and client disablement.
      const identity = await upstream('/auth/me', headers, { timeoutMs: metadata.timeoutMs })
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
      if (url.pathname === '/frontend/session')
        return withLifecycle(reply(200, {
          mode: 'client',
          contract_revision: identity.headers.get('X-Pantau-Contract-Revision'),
          principal: {
            client_id: principal.client_id,
            client_slug: principal.client_slug,
            username: '',
            role: 'reader',
            kind: 'key',
            scope: 'data:read',
          },
        }), identity)
      if (url.pathname === '/api/v1/telemetry') {
        const data = await upstream(
          url.pathname,
          {
            ...headers,
            'Content-Type': 'application/json',
            Prefer: 'respond-async',
            'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
          },
          { method: 'POST', body: telemetryBody, timeoutMs: metadata.timeoutMs },
        )
        if (data.status !== 202) {
          const status = [400, 401, 403, 404, 413, 415, 429, 503].includes(data.status)
            ? data.status
            : 502
          const response = reply(status, { error: 'Telemetry unavailable or rejected' })
          const retryAfter = data.headers.get('Retry-After')
          if (retryAfter && /^\d{1,4}$/.test(retryAfter))
            response.headers.set('Retry-After', retryAfter)
          return withLifecycle(response, data)
        }
        const responseHeaders = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'X-Frontend-Access': 'client',
        }
        const preference = data.headers.get('preference-applied')
        if (preference) responseHeaders['Preference-Applied'] = preference
        return withLifecycle(Response.json(
          { data: { accepted: true } },
          { status: 202, headers: responseHeaders },
        ), data)
      }
      const data = await upstream(url.pathname + url.search, headers)
      if (!data.ok)
        return withLifecycle(reply(data.status === 429 ? 429 : data.status >= 500 ? 502 : data.status, {
          error: 'Data unavailable',
        }), data)
      return withLifecycle(new Response(data.body, {
        status: data.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      }), data)
    } catch {
      return reply(503, { error: 'Data service unavailable' })
    }
  }
}

function safeGeoHeader(value, max) {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    /[\u0000-\u001f\u007f]/u.test(value)
  )
    return null
  return value.trim() ? encodeURIComponent(value.trim()) : null
}

async function readTelemetryBody(request) {
  const limit = 16 * 1024
  if (Number(request.headers.get('content-length')) > limit)
    throw new RangeError('payload')
  if (!request.body) return new Uint8Array()
  const reader = request.body.getReader()
  const chunks = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > limit) {
        await reader.cancel()
        throw new RangeError('payload')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const body = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

function sanitizeOriginHeader(value) {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    if (parsed.username || parsed.password) return null
    return parsed.origin
  } catch {
    return null
  }
}

function safeClientIP(value) {
  if (typeof value !== 'string' || value.length > 45) return null
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return value
      .split('.')
      .every((part) => Number(part) <= 255 && String(Number(part)) === part)
      ? value
      : null
  }
  if (!/^[\da-fA-F:.]+$/.test(value) || !value.includes(':')) return null
  try {
    return new URL(`http://[${value}]`).hostname.slice(1, -1)
  } catch {
    return null
  }
}
