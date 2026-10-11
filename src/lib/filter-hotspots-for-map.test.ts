import { describe, expect, it } from 'vitest'

import { filterHotspotsForMap } from '@/lib/filter-hotspots-for-map'
import type { HotspotFeatureCollection, Region } from '@/data/types'

const region: Region = {
  code: 'IDN.1.1_1',
  name: 'Kab. Tes',
  province: 'Papua',
  time_zone: 'WIT',
  center: [140, -8],
  weather_danger: { class: 'aman', fwi: 1, source: 'FWI dihitung' },
  risk_category: 'sangat_tinggi',
  hotspots_24h: 2,
  trend_7d: [0, 0, 0, 0, 0, 0, 2],
  weather: {
    temp_c: 30,
    condition: 'Cerah',
    humidity: 50,
    wind_kmh: 5,
    dry_days: 1,
  },
  air_quality: { pm25: 10, category: 'baik' },
  last_detection: {
    time: '2026-10-11T00:00:00Z',
    satellite: 'VIIRS',
    confidence: 'tinggi',
    frp_mw: 1,
  },
  summary: '',
  actions: ['x'],
}

const data: HotspotFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [140.1, -8.1] },
      properties: {
        time: '2026-10-11T00:00:00Z',
        satellite: 'VIIRS',
        confidence: 'tinggi',
        frp_mw: 1,
        region_code: 'IDN.1.1_1',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [141, -9] },
      properties: {
        time: '2026-10-11T00:00:00Z',
        satellite: 'VIIRS',
        confidence: 'tinggi',
        frp_mw: 1,
        region_code: 'OTHER',
      },
    },
  ],
}

describe('filterHotspotsForMap', () => {
  it('empty on national overview', () => {
    expect(filterHotspotsForMap(data, [region], 'Semua', null).features).toHaveLength(0)
  })

  it('filters to selected kab with risk weight', () => {
    const out = filterHotspotsForMap(data, [region], 'Semua', 'IDN.1.1_1')
    expect(out.features).toHaveLength(1)
    expect(out.features[0]?.properties.weight).toBe(1)
  })
})
