import type { HotspotFeature, Region } from '@/data/types'
import { computeNearby } from '@/lib/nearby'

/** Prefer wilayah pusat terdekat, else wilayah hotspot terdekat dalam 25 km. */
export function resolveUserRegionCode(
  coords: { lon: number; lat: number },
  regions: Region[],
  hotspots: HotspotFeature[],
): string | null {
  const nearby = computeNearby(coords, hotspots, regions)
  return nearby.userRegionCode ?? nearby.nearest?.regionCode ?? null
}
