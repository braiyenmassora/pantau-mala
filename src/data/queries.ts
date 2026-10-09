import { useQuery } from '@tanstack/react-query'

import {
  parseDaftarWilayah,
  parseHotspots,
  parseMeta,
  parseRegions,
} from '@/data/schema'

const STALE_MS = 5 * 60 * 1000
const REFETCH_MS = 15 * 60 * 1000
const CATALOG_STALE_MS = 24 * 60 * 60 * 1000

/** Empty VITE_DATA_URL → local mock under /data. */
export function isDummyDataMode(): boolean {
  const v = import.meta.env.VITE_DATA_URL
  return v == null || String(v).trim() === ''
}

function dataBaseUrl() {
  if (isDummyDataMode()) return '/data'
  return String(import.meta.env.VITE_DATA_URL).replace(/\/$/, '')
}

async function fetchJson<T>(
  path: string,
  parse: (data: unknown) => T,
): Promise<T> {
  const res = await fetch(`${dataBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`)
  const json: unknown = await res.json()
  return parse(json)
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => fetchJson('/wilayah.json', parseRegions),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useHotspots() {
  return useQuery({
    queryKey: ['hotspots'],
    queryFn: () => fetchJson('/titik-panas-24j.geojson', parseHotspots),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}

/** Alias for hotspot GeoJSON (titik panas 24 jam). */
export const useTitikPanas = useHotspots

export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: () => fetchJson('/meta.json', parseMeta),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useDaftarWilayah() {
  return useQuery({
    queryKey: ['daftar-wilayah'],
    queryFn: () => fetchJson('/daftar-wilayah.json', parseDaftarWilayah),
    staleTime: CATALOG_STALE_MS,
  })
}
