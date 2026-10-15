import { createClientGateway } from './server/client-gateway.mjs'

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  FE_ACCESS_MODE: string
  PANTAU_API_ORIGIN: string
  PANTAU_CLIENT_SLUG: string
  PANTAU_API_KEY: string
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher = fetch,
): Promise<Response> {
  const pathname = new URL(request.url).pathname
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
    return Response.json(
      { error: 'Data service unavailable' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
      },
    )
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env)
  },
}
