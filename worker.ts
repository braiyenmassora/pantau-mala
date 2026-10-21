import { createClientGateway } from './server/client-gateway.mjs'

interface ReportPhotoObject {
  body: ReadableStream
  size: number
  etag: string
  uploaded: Date
  httpMetadata?: { contentType?: string }
}

interface ReportPhotoBucket {
  get(key: string): Promise<ReportPhotoObject | null>
}

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  REPORT_PHOTOS?: ReportPhotoBucket
  FE_ACCESS_MODE: string
  PANTAU_API_ORIGIN: string
  PANTAU_CLIENT_SLUG: string
  PANTAU_API_KEY: string
}

const REPORT_PHOTO_ROUTE = '/report-photos/'
const REPORT_PHOTO_KEY =
  /^hotspot-reports\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/i

/** Foto laporan dilayani dari binding R2 sendiri — host r2.dev tidak andal diblokir sebagian ISP. */
async function serveReportPhoto(
  request: Request,
  bucket: ReportPhotoBucket | undefined,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
  }
  const key = new URL(request.url).pathname.slice(REPORT_PHOTO_ROUTE.length)
  if (!bucket || !REPORT_PHOTO_KEY.test(key)) {
    return new Response(null, { status: 404 })
  }
  const object = await bucket.get(key)
  if (!object) return new Response(null, { status: 404 })
  const headers = new Headers({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Length': String(object.size),
    'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
    ETag: object.etag,
    'Last-Modified': object.uploaded.toUTCString(),
    'X-Content-Type-Options': 'nosniff',
  })
  return new Response(request.method === 'HEAD' ? null : object.body, { headers })
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher = fetch,
): Promise<Response> {
  const pathname = new URL(request.url).pathname
  if (pathname.startsWith(REPORT_PHOTO_ROUTE)) {
    return serveReportPhoto(request, env.REPORT_PHOTOS)
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
