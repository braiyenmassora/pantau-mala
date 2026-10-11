import distance from '@turf/distance'
import { point } from '@turf/helpers'

import type { HotspotFeature, Region } from '@/data/types'

export const NEARBY_HOTSPOT_RADIUS_KM = 25
export const USER_REGION_RADIUS_KM = 50

export type NearestHotspot = {
  /** Rounded to 1 decimal. */
  distanceKm: number
  /** Null bila hotspot tanpa region_code. */
  regionCode: string | null
}

export type NearbyResult = {
  hotspotCount: number
  nearest: NearestHotspot | null
  /** Region whose center is nearest within 50 km; null if none. */
  userRegionCode: string | null
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Hotspots within 25 km (sedang/tinggi only), nearest point, and host region.
 * Skip titik yang region_code-nya tidak ada di /v1/regions (bukan pin MVP).
 * Titik tanpa region_code tetap dihitung (koordinat mentah).
 */
export function computeNearby(
  user: { lon: number; lat: number },
  hotspots: HotspotFeature[],
  regions: Region[],
): NearbyResult {
  const origin = point([user.lon, user.lat])
  const regionCodes = new Set(regions.map((r) => r.code))

  let nearest: NearestHotspot | null = null
  let hotspotCount = 0

  for (const feature of hotspots) {
    const { confidence, region_code } = feature.properties
    if (confidence !== 'sedang' && confidence !== 'tinggi') continue

    const code = region_code?.trim() || null
    if (code && !regionCodes.has(code)) continue

    const km = distance(origin, point(feature.geometry.coordinates), {
      units: 'kilometers',
    })
    if (!Number.isFinite(km) || km > NEARBY_HOTSPOT_RADIUS_KM) continue

    hotspotCount += 1
    if (!nearest || km < nearest.distanceKm) {
      nearest = { distanceKm: km, regionCode: code }
    }
  }

  if (nearest) {
    nearest = { ...nearest, distanceKm: round1(nearest.distanceKm) }
  }

  let userRegionCode: string | null = null
  let bestRegionKm = Infinity
  for (const region of regions) {
    const km = distance(origin, point(region.center), { units: 'kilometers' })
    if (!Number.isFinite(km) || km > USER_REGION_RADIUS_KM || km >= bestRegionKm) {
      continue
    }
    bestRegionKm = km
    userRegionCode = region.code
  }

  return { hotspotCount, nearest, userRegionCode }
}
