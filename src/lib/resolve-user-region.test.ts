import { describe, expect, it } from 'vitest'

import type { HotspotFeature, Region } from '@/data/types'
import { resolveUserRegionCode } from '@/lib/resolve-user-region'

function stubRegion(code: string, lon: number, lat: number): Region {
  return {
    code,
    name: code,
    province: 'X',
    time_zone: 'WIB',
    center: [lon, lat],
    weather_danger: { class: 'ekstrem', fwi: 40, source: 'BMKG' },
    risk_category: 'sedang',
    hotspots_24h: 1,
    trend_7d: [0, 0, 0, 0, 0, 0, 1],
    weather: {
      temp_c: 30,
      condition: 'Cerah',
      humidity: 50,
      wind_kmh: 5,
      dry_days: 1,
    },
    air_quality: { pm25: 10, category: 'baik' },
    last_detection: {
      time: '2026-10-09T12:00:00+07:00',
      satellite: 'VIIRS',
      confidence: 'tinggi',
      frp_mw: 1,
    },
    summary: '',
    actions: [],
  }
}

function stubHotspot(lon: number, lat: number, region_code: string): HotspotFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      time: '2026-10-09T12:00:00+07:00',
      satellite: 'VIIRS',
      confidence: 'tinggi',
      frp_mw: 2,
      region_code,
    },
  }
}

describe('resolveUserRegionCode', () => {
  it('prefers nearest region pusat within 50 km', () => {
    const regions = [stubRegion('far', 120, 0), stubRegion('near', 106.85, -6.2)]
    expect(resolveUserRegionCode({ lon: 106.84, lat: -6.18 }, regions, [])).toBe('near')
  })

  it('falls back to nearest hotspot region', () => {
    const regions = [stubRegion('host', 110, 0)]
    const hotspots = [stubHotspot(106.84, -6.18, 'host')]
    // User far from any pusat but near a hotspot of host
    expect(resolveUserRegionCode({ lon: 106.84, lat: -6.18 }, regions, hotspots)).toBe(
      'host',
    )
  })
})
