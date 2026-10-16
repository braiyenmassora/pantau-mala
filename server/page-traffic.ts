import { createClientGateway } from './client-gateway.mjs'

type Gateway = ReturnType<typeof createClientGateway>
type Metadata = NonNullable<Parameters<Gateway>[1]>

export async function preparePageTraffic(request: Request, response: Response) {
  const headers = request.headers
  const purpose = `${headers.get('purpose') || ''} ${headers.get('sec-purpose') || ''}`
  const destination = headers.get('sec-fetch-dest')
  if (
    request.method !== 'GET' ||
    response.status !== 200 ||
    !response.headers.get('content-type')?.includes('text/html') ||
    !headers.get('accept')?.includes('text/html') ||
    (destination && destination !== 'document') ||
    /prefetch|prerender/i.test(purpose) ||
    /bot|crawler|spider|headless/i.test(headers.get('user-agent') || '')
  )
    return null

  const url = new URL(request.url)
  if (!/^\/(?!\/)[a-zA-Z0-9/_.-]{0,255}$/.test(url.pathname)) return null
  const id = crypto.randomUUID()
  const html = await response.clone().text()
  if (!/<head(?:\s[^>]*)?>/i.test(html)) return null
  const outgoing = new Headers(response.headers)
  outgoing.set('Cache-Control', 'no-store')
  outgoing.set('Accept-CH', 'Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform')
  for (const name of ['Content-Length', 'ETag', 'Last-Modified']) outgoing.delete(name)
  const telemetryHeaders = new Headers({
    'Content-Type': 'application/json',
    Prefer: 'respond-async',
    'X-Pantau-Telemetry-Transport': 'fetch-keepalive',
    'X-Pantau-Telemetry-Source': 'edge',
    Origin: url.origin,
  })
  for (const name of [
    'user-agent',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
  ]) {
    const value = headers.get(name)
    if (value) telemetryHeaders.set(name, value)
  }
  return {
    response: new Response(
      html.replace(
        /<head(?:\s[^>]*)?>/i,
        (head) => `${head}<meta name="pantau-page-view" content="${id}">`,
      ),
      { status: response.status, headers: outgoing },
    ),
    id,
    body: JSON.stringify({
      events: [
        {
          id,
          session_id: '',
          type: 'page_view',
          path: url.pathname,
          referrer: safeOrigin(headers.get('referer')),
        },
      ],
    }),
    headers: telemetryHeaders,
    origin: url.origin,
  }
}

function safeOrigin(value: string | null) {
  try {
    const url = new URL(value || '')
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.origin
      : ''
  } catch {
    return ''
  }
}

export async function deliverPageTraffic(
  page: NonNullable<Awaited<ReturnType<typeof preparePageTraffic>>>,
  gateway: Gateway,
  metadata: Metadata,
) {
  let status = 0
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await gateway(
        new Request(`${page.origin}/api/v1/telemetry`, {
          method: 'POST',
          headers: page.headers,
          body: page.body,
        }),
        { ...metadata, viewSource: 'edge', timeoutMs: 3500 },
      )
      status = response?.status || 0
      if (status === 202) return
      if (status >= 400 && status < 500 && status !== 429) break
      if (Number(response?.headers.get('Retry-After')) > 5) break
    } catch {
      status = 0
    }
    if (attempt < 2)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
  }
  console.warn('Frontend page view not accepted', { event_id: page.id, status })
}
