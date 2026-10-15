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
      geometry: { type: 'Point', coordinates: [140.2, -8.2] },
      properties: {
        time: '2026-10-11T00:00:00Z',
        satellite: 'MODIS',
        confidence: 'rendah',
        frp_mw: 0.4,
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
  it('renders observed points on national overview', () => {
    expect(filterHotspotsForMap(data, [region], 'Semua', null).features).toHaveLength(2)
  })

  it('filters to selected kab with confidence weight', () => {
    const out = filterHotspotsForMap(data, [region], 'Semua', 'IDN.1.1_1')
    expect(out.features).toHaveLength(2)
    expect(out.features[0]?.properties.weight).toBe(1)
    expect(out.features[1]?.properties.weight).toBe(0.2)
  })

  it.each([
    ['sangat_tinggi', 3],
    ['sedang', 2],
    ['rendah', 1],
    ['tidak_tersedia', 0],
  ] as const)(
    'uses backend risk %s for radar independently of confidence and count',
    (risk, rank) => {
      const out = filterHotspotsForMap(
        data,
        [{ ...region, risk_category: risk, hotspots_24h: 9999 }],
        'Semua',
        null,
      )
      expect(out.features.map((feature) => feature.properties.risk_rank)).toEqual([
        rank,
        rank,
      ])
    },
  )
})

it('stale unclassified regions retain satellite density', () => {
  const stale = {
    ...region,
    risk_category: 'tidak_tersedia' as const,
    quality: 'stale' as const,
  }
  const out = filterHotspotsForMap(data, [stale], 'Semua', null)
  expect(out.features).toHaveLength(2)
  expect(out.features[0].properties.weight).toBe(1)
})
it('category/province filter passed through regions excludes other observations', () => {
  expect(filterHotspotsForMap(data, [], 'Semua', null).features).toHaveLength(0)
  expect(filterHotspotsForMap(data, [region], 'Papua', 'OTHER').features).toHaveLength(0)
})
