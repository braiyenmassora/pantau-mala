import { createClientGateway } from './server/client-gateway.mjs'
import { deliverPageTraffic, preparePageTraffic } from './server/page-traffic'

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  FE_ACCESS_MODE: string
  PANTAU_API_ORIGIN: string
  PANTAU_CLIENT_SLUG: string
  PANTAU_API_KEY: string
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher = fetch,
  executionContext?: ExecutionContext,
): Promise<Response> {
  const pathname = new URL(request.url).pathname
  const reserved =
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    pathname === '/frontend/session'
  if (!reserved) {
    const assetHeaders = new Headers(request.headers)
    if (
      request.method === 'GET' &&
      request.headers.get('Accept')?.includes('text/html')
    ) {
      assetHeaders.delete('If-None-Match')
      assetHeaders.delete('If-Modified-Since')
    }
    const assetResponse = await env.ASSETS.fetch(
      new Request(request, { headers: assetHeaders }),
    )
    if (env.FE_ACCESS_MODE !== 'client' || !env.PANTAU_API_KEY) return assetResponse
    try {
      const page = await preparePageTraffic(request, assetResponse)
      if (!page) return assetResponse
      const gateway = createClientGateway(
        {
          FE_ACCESS_MODE: 'client',
          PANTAU_API_ORIGIN: env.PANTAU_API_ORIGIN,
          PANTAU_CLIENT_SLUG: env.PANTAU_CLIENT_SLUG,
          PANTAU_API_KEY: env.PANTAU_API_KEY,
        },
        fetcher,
      )
      const cf = (
        request as Request & {
          cf?: { country?: string; region?: string; city?: string }
        }
      ).cf
      const metadata = {
        runtime: 'cloudflare' as const,
        clientIP: request.headers.get('CF-Connecting-IP'),
        clientCountry: cf?.country,
        clientRegion:
          request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1'
            ? undefined
            : cf?.region,
        clientCity:
          request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1'
            ? undefined
            : cf?.city,
      }
      const delivery = deliverPageTraffic(page, gateway, metadata)
      if (executionContext) executionContext.waitUntil(delivery)
      else void delivery
      return page.response
    } catch {
      console.warn('Frontend measurement unavailable; serving document without telemetry')
      return assetResponse
    }
  }

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
    const cf = (
      request as Request & {
        cf?: { country?: string; region?: string; city?: string }
      }
    ).cf
    const response = await gateway(request, {
      runtime: 'cloudflare',
      clientIP: request.headers.get('CF-Connecting-IP'),
      clientCountry: cf?.country,
      clientRegion: cf?.region,
      clientCity: cf?.city,
    })
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
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    return handleRequest(request, env, fetch, executionContext)
  },
}
