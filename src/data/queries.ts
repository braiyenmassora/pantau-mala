import { useQuery } from '@tanstack/react-query'

import { parseHotspots, parseMeta, parseRegionCatalog, parseRegions } from '@/data/schema'

const STALE_MS = 5 * 60 * 1000
/** Cadence ingest BE ~3 jam. */
const REFETCH_MS = 3 * 60 * 60 * 1000
const CATALOG_STALE_MS = 24 * 60 * 60 * 1000

function dataBaseUrl(): string {
  const v = import.meta.env.VITE_DATA_URL
  if (v == null || String(v).trim() === '') {
    throw new Error('VITE_DATA_URL wajib di-set (base URL API, tanpa slash akhir).')
  }
  return String(v).replace(/\/$/, '')
}

async function fetchJson<T>(path: string, parse: (data: unknown) => T): Promise<T> {
  const url = `${dataBaseUrl()}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`)
  const json: unknown = await res.json()
  return parse(json)
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => fetchJson('/v1/regions', parseRegions),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useHotspots() {
  return useQuery({
    queryKey: ['hotspots'],
    queryFn: () => fetchJson('/v1/hotspots', parseHotspots),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: () => fetchJson('/v1/meta', parseMeta),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useRegionCatalog() {
  return useQuery({
    queryKey: ['region-catalog'],
    queryFn: () => fetchJson('/v1/region-catalog', parseRegionCatalog),
    staleTime: CATALOG_STALE_MS,
  })
}
