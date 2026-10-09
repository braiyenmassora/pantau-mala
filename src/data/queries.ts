import { useQuery } from '@tanstack/react-query'

import type { HotspotFeatureCollection, Meta, Region } from '@/data/types'

const STALE_MS = 5 * 60 * 1000
const REFETCH_MS = 15 * 60 * 1000

function dataBaseUrl() {
  const base = import.meta.env.VITE_DATA_URL ?? '/data'
  return base.replace(/\/$/, '')
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${dataBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`)
  return res.json() as Promise<T>
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => fetchJson<Region[]>('/wilayah.json'),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useHotspots() {
  return useQuery({
    queryKey: ['hotspots'],
    queryFn: () => fetchJson<HotspotFeatureCollection>('/titik-panas-24j.geojson'),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}

/** Alias for hotspot GeoJSON (titik panas 24 jam). */
export const useTitikPanas = useHotspots

export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: () => fetchJson<Meta>('/meta.json'),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
  })
}
