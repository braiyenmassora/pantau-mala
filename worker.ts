import { createClientGateway } from './server/client-gateway.mjs'

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  FE_ACCESS_MODE: string
  PANTAU_API_ORIGIN: string
  PANTAU_CLIENT_SLUG: string
  PANTAU_API_KEY: string
}

const REPORT_PHOTO_ROUTE = '/report-photos/'
const REPORT_PHOTO_KEY =
  /^hotspot-reports\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/i

const REPORT_PHOTO_ORIGIN =
  'https://pub-32d942c9574c4f02a9c7fb2e260e33e2.r2.dev'

/**
 * Foto laporan diproksi dari URL publik R2 milik BE — bucket BE ada di akun
 * Cloudflare lain sehingga binding R2 tidak bisa menjangkaunya, dan host
 * r2.dev dari browser pengguna tidak andal (diblokir sebagian ISP), jadi
 * pengambilan dilakukan dari edge Worker.
 */
async function serveReportPhoto(
  request: Request,
  fetcher: typeof fetch,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
  }
  const key = new URL(request.url).pathname.slice(REPORT_PHOTO_ROUTE.length)
  if (!REPORT_PHOTO_KEY.test(key)) return new Response(null, { status: 404 })
  const upstream = await fetcher(`${REPORT_PHOTO_ORIGIN}/${key}`, {
    method: request.method,
  })
  if (!upstream.ok) return new Response(null, { status: 404 })
  const headers = new Headers({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type':
      upstream.headers.get('Content-Type') ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  })
  const etag = upstream.headers.get('ETag')
  if (etag) headers.set('ETag', etag)
  const lastModified = upstream.headers.get('Last-Modified')
  if (lastModified) headers.set('Last-Modified', lastModified)
  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    headers,
  })
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher = fetch,
): Promise<Response> {
  const pathname = new URL(request.url).pathname
  if (pathname.startsWith(REPORT_PHOTO_ROUTE)) {
    return serveReportPhoto(request, fetcher)
  }
  const reserved =
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    pathname === '/frontend/session'
  if (!reserved) return env.ASSETS.fetch(request)

  try {
    if (env.FE_ACCESS_MODE !== 'client') throw new Error('Client gateway required')
    const gateway = createClientGateway(
      {
        FE_ACCESS_MODE: 'client',
        PANTAU_API_ORIGIN: env.PANTAU_API_ORIGIN,
        PANTAU_CLIENT_SLUG: env.PANTAU_CLIENT_SLUG,
        PANTAU_API_KEY: env.PANTAU_API_KEY,
      },
      fetcher,
    )
    const response = await gateway(request)
    return response || Response.json({ error: 'Unknown data route' }, { status: 404 })
  } catch {
    // Tetap kirim mode client agar FE tidak jatuh ke form login akun.
    const headers: Record<string, string> = {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    }
    if (env.FE_ACCESS_MODE === 'client') headers['X-Frontend-Access'] = 'client'
    return Response.json({ error: 'Data service unavailable' }, { status: 503, headers })
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env)
  },
}
