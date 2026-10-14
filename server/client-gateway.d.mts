export function createClientGateway(env: Record<string, string | undefined>, fetcher?: typeof fetch): (request: Request) => Promise<Response | null>
