import { useQuery } from '@tanstack/react-query'

import { getCopy } from '@/copy'
import { expireSession, useSession } from '@/auth/session'
import { decodeRegions, decodeHotspots, decodeMeta, decodeCatalog } from './go-contract'
import { nearbyHotspotsSchema } from './extended-contract'

const STALE_MS = 5 * 60 * 1000

export async function getData<T>(
  path: string,
  parse: (data: unknown) => T,
  signal?: AbortSignal,
  init?: { method: 'POST'; body: string },
): Promise<T> {
  const { token, generation, accessMode } = useSession.getState()
  if (!token && accessMode !== 'client') throw new Error(getCopy().errors.sessionRequired)
  const configured = import.meta.env.VITE_DATA_URL?.trim() || '/api/v1'
  if (configured !== '/api/v1') throw new Error(getCopy().errors.proxyOriginRequired)
  const res = await fetch(configured + path, {
    method: init?.method ?? 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body,
    credentials: 'same-origin',
    cache: 'no-store',
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000),
  })
  if (res.status === 401) {
    if (useSession.getState().generation === generation) expireSession()
    throw new Error(getCopy().errors.sessionExpired)
  }
  if (!res.ok)
    // Tanpa jargon status HTTP (pola Pola Mantap); 429 dipertahankan untuk deteksi toast.
    throw new Error(
      res.status === 429
        ? getCopy().errors.rateLimited
        : res.status >= 500
          ? getCopy().errors.serviceNotReady
          : getCopy().errors.loadFallback,
    )
  return parse(await res.json())
}

async function allRegions(signal: AbortSignal) {
  const out = []
  for (let offset = 0; offset < 10000; offset += 1000) {
    const page = await getData(
      `/regions?limit=1000&offset=${offset}`,
      decodeRegions,
      signal,
    )
    out.push(...page)
    if (page.length < 1000) return out
  }
  throw new Error(getCopy().errors.catalogTooLarge)
}

function useClientQuery<T>(
  name: string,
  load: (signal: AbortSignal) => Promise<T>,
  catalog = false,
) {
  const session = useSession()
  return useQuery({
    queryKey: [name, session.principal?.client_id, session.generation],
    enabled: session.status === 'authenticated',
    queryFn: ({ signal }) => load(signal),
    staleTime: STALE_MS,
    refetchInterval: catalog ? false : STALE_MS,
  })
}

export function useRegions() {
  return useClientQuery('regions', allRegions)
}

export function useHotspots() {
  return useClientQuery('hotspots', (signal) =>
    getData('/hotspots.geojson', decodeHotspots, signal),
  )
}

export function useMeta() {
  return useClientQuery('meta', (signal) => getData('/data-status', decodeMeta, signal))
}

export function useRegionCatalog() {
  return useClientQuery(
    'region-catalog',
    (signal) => getData('/region-catalog', decodeCatalog, signal),
    true,
  )
}

export function useNearbyHotspots(
  lat?: number | null,
  lon?: number | null,
  radiusKm = 25,
) {
  const session = useSession()
  const enabled =
    session.status === 'authenticated' &&
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon)

  return useQuery({
    queryKey: [
      'nearby-hotspots',
      lat,
      lon,
      radiusKm,
      session.principal?.client_id,
      session.generation,
    ],
    enabled,
    queryFn: ({ signal }) =>
      getData(
        `/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`,
        (raw) => nearbyHotspotsSchema.parse(raw).data,
        signal,
      ),
    staleTime: STALE_MS,
  })
}
