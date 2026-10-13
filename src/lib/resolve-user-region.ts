import type { NearbyHotspot } from '@/data/extended-contract'
import type { HotspotFeature, Region } from '@/data/types'
import { computeNearby, computeNearbyFromApi } from '@/lib/nearby'

/** Prefer wilayah pusat terdekat, else wilayah hotspot terdekat dalam 25 km (dari GeoJSON). */
export function resolveUserRegionCode(
  coords: { lon: number; lat: number },
  regions: Region[],
  hotspots: HotspotFeature[],
): string | null {
  const nearby = computeNearby(coords, hotspots, regions)
  return nearby.userRegionCode ?? nearby.nearest?.regionCode ?? null
}

/** Prefer wilayah pusat terdekat, else wilayah hotspot terdekat dalam 25 km (dari PostGIS /nearby API). */
export function resolveUserRegionCodeFromApi(
  coords: { lon: number; lat: number },
  regions: Region[],
  nearbyHotspots: NearbyHotspot[],
): string | null {
  const nearby = computeNearbyFromApi(coords, nearbyHotspots, regions)
  return nearby.userRegionCode ?? nearby.nearest?.regionCode ?? null
}
