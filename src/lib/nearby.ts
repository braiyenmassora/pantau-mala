import distance from '@turf/distance'
import { point } from '@turf/helpers'

import type { NearbyHotspot } from '@/data/extended-contract'
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
 * Fast geodesic haversine formula in kilometers (zero dependency, zero allocation).
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLon = (lon2 - lon1) * toRad
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) *
      Math.cos(lat2 * toRad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Optimized nearby evaluation consuming PostGIS `/api/v1/nearby` results directly.
 * Skips looping over thousands of GeoJSON features in user browser memory.
 */
export function computeNearbyFromApi(
  user: { lon: number; lat: number },
  nearbyHotspots: NearbyHotspot[],
  regions: Region[],
): NearbyResult {
  const regionCodes = new Set(regions.map((r) => r.code))

  let nearest: NearestHotspot | null = null
  let hotspotCount = 0

  for (const h of nearbyHotspots) {
    if (h.keyakinan !== 'sedang' && h.keyakinan !== 'tinggi') continue

    const code = h.kode_wilayah?.trim() || null
    if (code && !regionCodes.has(code)) continue

    const km = haversineKm(user.lat, user.lon, h.latitude, h.longitude)
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
  for (const r of regions) {
    const km = haversineKm(user.lat, user.lon, r.center[1], r.center[0])
    if (!Number.isFinite(km) || km > USER_REGION_RADIUS_KM || km >= bestRegionKm) {
      continue
    }
    bestRegionKm = km
    userRegionCode = r.code
  }

  return { hotspotCount, nearest, userRegionCode }
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
