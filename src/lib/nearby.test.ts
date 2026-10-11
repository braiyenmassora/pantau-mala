import { describe, expect, it } from 'vitest'

import type { HotspotFeature, Region } from '@/data/types'
import { computeNearby } from '@/lib/nearby'

function hotspot(
  lon: number,
  lat: number,
  confidence: HotspotFeature['properties']['confidence'],
  region_code?: string,
): HotspotFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      time: '2026-10-09T00:00:00+07:00',
      satellite: 'VIIRS',
      confidence,
      frp_mw: 1,
      ...(region_code ? { region_code } : {}),
    },
  }
}

function region(code: string, lon: number, lat: number): Region {
  return {
    code,
    name: code,
    province: 'x',
    time_zone: 'WIB',
    center: [lon, lat],
    weather_danger: { class: 'ekstrem', fwi: 40, source: 'BMKG' },
    risk_category: 'rendah',
    hotspots_24h: 1,
    trend_7d: [0, 0, 0, 0, 0, 0, 0],
    weather: {
      temp_c: 30,
      condition: 'Cerah',
      humidity: 50,
      wind_kmh: 5,
      dry_days: 1,
    },
    air_quality: { pm25: 10, category: 'baik' },
    last_detection: {
      time: '2026-10-09T00:00:00+07:00',
      satellite: 'VIIRS',
      confidence: 'tinggi',
      frp_mw: 1,
    },
    summary: '',
    actions: [],
  }
}

// ~0.09° lon ≈ 10 km near equator
const USER = { lon: 114.2, lat: -2.9 }

describe('computeNearby', () => {
  it('counts sedang/tinggi within 25 km and ignores rendah', () => {
    const result = computeNearby(
      USER,
      [
        hotspot(114.25, -2.9, 'tinggi', 'A'),
        hotspot(114.28, -2.9, 'sedang', 'B'),
        hotspot(114.25, -2.9, 'rendah', 'C'),
        hotspot(115.0, -2.9, 'tinggi', 'D'),
      ],
      [region('A', 114.2, -2.9), region('B', 114.3, -2.9)],
    )
    expect(result.hotspotCount).toBe(2)
    expect(result.nearest?.regionCode).toBe('A')
    expect(result.nearest?.distanceKm).toBeGreaterThan(0)
  })

  it('rounds nearest distance to 1 decimal', () => {
    const result = computeNearby(
      USER,
      [hotspot(114.29, -2.9, 'tinggi', 'A')],
      [region('A', 114.2, -2.9)],
    )
    expect(result.nearest).not.toBeNull()
    expect(String(result.nearest!.distanceKm)).toMatch(/^\d+(\.\d)?$/)
  })

  it('picks nearest region pusat within 50 km', () => {
    const result = computeNearby(
      USER,
      [],
      [
        region('far', 116, -2.9),
        region('near', 114.3, -2.9),
        region('nearer', 114.22, -2.9),
      ],
    )
    expect(result.userRegionCode).toBe('nearer')
  })

  it('returns null user region when none within 50 km', () => {
    const result = computeNearby(USER, [], [region('far', 120, 0)])
    expect(result.userRegionCode).toBeNull()
    expect(result.hotspotCount).toBe(0)
    expect(result.nearest).toBeNull()
  })

  it('ignores hotspots whose region_code is not in /v1/regions', () => {
    const result = computeNearby(
      USER,
      [hotspot(114.25, -2.9, 'tinggi', 'IDN.missing_1')],
      [region('A', 114.2, -2.9)],
    )
    expect(result.hotspotCount).toBe(0)
    expect(result.nearest).toBeNull()
  })

  it('counts raw hotspots without region_code', () => {
    const result = computeNearby(
      USER,
      [hotspot(114.25, -2.9, 'tinggi')],
      [region('A', 114.2, -2.9)],
    )
    expect(result.hotspotCount).toBe(1)
    expect(result.nearest?.regionCode).toBeNull()
    expect(result.nearest?.distanceKm).toBeGreaterThan(0)
  })
})
