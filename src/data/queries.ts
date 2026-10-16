import { useQuery } from '@tanstack/react-query'
import { expireSession, useSession } from '@/auth/session'
import { decodeRegions, decodeHotspots, decodeMeta, decodeCatalog } from './go-contract'
import { earthquakesSchema, nearbyHotspotsSchema } from './extended-contract'

const STALE_MS = 5 * 60 * 1000

export async function getData<T>(
  path: string,
  parse: (data: unknown) => T,
  signal?: AbortSignal,
): Promise<T> {
  const { token, generation, accessMode } = useSession.getState()
  if (!token && accessMode !== 'client') throw new Error('Sesi diperlukan.')
  const configured = import.meta.env.VITE_DATA_URL?.trim() || '/api/v1'
  if (configured !== '/api/v1')
    throw new Error(
      'FE dan API Go memerlukan proxy origin yang sama dengan base /api/v1.',
    )
  const res = await fetch(configured + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'same-origin',
    cache: 'no-store',
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000),
  })
  if (res.status === 401) {
    if (useSession.getState().generation === generation) expireSession()
    throw new Error('Sesi berakhir. Masuk kembali.')
  }
  if (!res.ok)
    throw new Error(
      res.status === 429
        ? 'Batas permintaan tercapai. Coba lagi nanti.'
        : `Data belum dapat dimuat (${res.status}).`,
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
  throw new Error('Katalog wilayah melebihi batas dukungan.')
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

export function useEarthquakes(kind: 'latest' | 'felt' | 'm5' = 'latest') {
  const session = useSession()
  return useQuery({
    queryKey: ['earthquakes', kind, session.principal?.client_id, session.generation],
    enabled: session.status === 'authenticated',
    queryFn: ({ signal }) =>
      getData(`/earthquakes?kind=${kind}`, (raw) => earthquakesSchema.parse(raw), signal),
    staleTime: STALE_MS,
  })
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
