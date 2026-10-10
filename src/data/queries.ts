import { useQuery } from '@tanstack/react-query'

import {
  parseDaftarWilayah,
  parseHotspotAreas,
  parseHotspots,
  parseMeta,
  parseRegions,
} from '@/data/schema'
import type { HotspotFeatureCollection, Region } from '@/data/types'
import type { HotspotAreaFeatureCollection } from '@/lib/hotspot-areas'

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

/**
 * Preferred: /data/area-titik-panas.geojson from the worker.
 * Fallback: compute from hotspots + wilayah in the browser.
 */
export function useHotspotAreas() {
  const hotspots = useHotspots()
  const regions = useRegions()

  const fileQuery = useQuery({
    queryKey: ['hotspot-areas-file'],
    queryFn: async () => {
      const res = await fetch(`${dataBaseUrl()}/area-titik-panas.geojson`)
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`Failed to load area-titik-panas (${res.status})`)
      return parseHotspotAreas(await res.json())
    },
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
    retry: false,
  })

  const computeQuery = useQuery({
    queryKey: [
      'hotspot-areas-computed',
      hotspots.dataUpdatedAt,
      regions.dataUpdatedAt,
    ],
    enabled:
      fileQuery.data == null &&
      !fileQuery.isPending &&
      !!hotspots.data &&
      !!regions.data,
    queryFn: async (): Promise<HotspotAreaFeatureCollection> => {
      const { computeHotspotAreas } = await import('@/lib/hotspot-areas')
      return computeHotspotAreas(
        hotspots.data as HotspotFeatureCollection,
        regions.data as Region[],
      )
    },
    staleTime: STALE_MS,
  })

  if (fileQuery.data) {
    return {
      ...fileQuery,
      data: fileQuery.data,
      isPending: false,
      isError: false,
    }
  }

  const pending =
    fileQuery.isPending ||
    hotspots.isPending ||
    regions.isPending ||
    computeQuery.isPending
  const error = fileQuery.isError
    ? false // 404 → fallback; other errors still fall back to compute
    : hotspots.isError || regions.isError || computeQuery.isError

  return {
    data: computeQuery.data,
    isPending: pending,
    isError: error,
    isFetching:
      hotspots.isFetching ||
      regions.isFetching ||
      fileQuery.isFetching ||
      computeQuery.isFetching,
    refetch: () => {
      void hotspots.refetch()
      void regions.refetch()
      void fileQuery.refetch()
      void computeQuery.refetch()
    },
  }
}

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
