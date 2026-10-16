export function createClientGateway(
  env: Record<string, string | undefined>,
  fetcher?: typeof fetch,
): (
  request: Request,
  metadata?: {
    runtime?: 'cloudflare'
    clientIP?: string | null
    clientCountry?: string | null
    clientRegion?: string | null
    clientCity?: string | null
  },
) => Promise<Response | null>
