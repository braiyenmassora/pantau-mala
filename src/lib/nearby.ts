import distance from '@turf/distance'
import { point } from '@turf/helpers'

import type { HotspotFeature, Region } from '@/data/types'

export const NEARBY_HOTSPOT_RADIUS_KM = 25
export const USER_REGION_RADIUS_KM = 50

export type NearestHotspot = {
  /** Rounded to 1 decimal. */
  distanceKm: number
  regionCode: string
}

export type NearbyResult = {
  hotspotCount: number
  nearest: NearestHotspot | null
  /** Region whose pusat is nearest within 50 km; null if none. */
  userRegionCode: string | null
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Hotspots within 25 km (sedang/tinggi only), nearest point, and host region. */
export function computeNearby(
  user: { lon: number; lat: number },
  hotspots: HotspotFeature[],
  regions: Region[],
): NearbyResult {
  const origin = point([user.lon, user.lat])

  let nearest: NearestHotspot | null = null
  let hotspotCount = 0

  for (const feature of hotspots) {
    const { keyakinan, kode_wilayah } = feature.properties
    if (keyakinan !== 'sedang' && keyakinan !== 'tinggi') continue

    const km = distance(origin, point(feature.geometry.coordinates), {
      units: 'kilometers',
    })
    if (km > NEARBY_HOTSPOT_RADIUS_KM) continue

    hotspotCount += 1
    if (!nearest || km < nearest.distanceKm) {
      nearest = { distanceKm: km, regionCode: kode_wilayah }
    }
  }

  if (nearest) {
    nearest = { ...nearest, distanceKm: round1(nearest.distanceKm) }
  }

  let userRegionCode: string | null = null
  let bestRegionKm = Infinity
  for (const region of regions) {
    const km = distance(origin, point(region.pusat), { units: 'kilometers' })
    if (km > USER_REGION_RADIUS_KM || km >= bestRegionKm) continue
    bestRegionKm = km
    userRegionCode = region.kode
  }

  return { hotspotCount, nearest, userRegionCode }
}
