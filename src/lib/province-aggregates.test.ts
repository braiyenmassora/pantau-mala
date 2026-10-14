import { describe, expect, it } from 'vitest'

import { aggregateByProvince } from '@/lib/province-aggregates'
import type { CatalogProvince, Region } from '@/data/types'

const provinces: CatalogProvince[] = [
  {
    code: 'IDN.1',
    name: 'Kalimantan Tengah',
    bbox: [110, -4, 116, 0],
    center: [113, -2],
  },
  {
    code: 'IDN.2',
    name: 'Jambi',
    bbox: [101, -3, 105, -0.5],
    center: [103, -1.5],
  },
]

function region(
  partial: Partial<Region> & Pick<Region, 'province' | 'hotspots_24h'>,
): Region {
  return {
    code: 'x',
    name: 'Kab',
    time_zone: 'WIB',
    center: [0, 0],
    weather_danger: { class: 'aman', fwi: 1, source: 'FWI dihitung' },
    risk_category: 'sedang',
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
      time: '2026-10-11T00:00:00Z',
      satellite: 'VIIRS',
      confidence: 'tinggi',
      frp_mw: 1,
    },
    summary: '',
    actions: ['x'],
    ...partial,
  }
}

describe('aggregateByProvince', () => {
  it('sums hotspots and skips empty provinces', () => {
    const rows = aggregateByProvince(
      [
        region({ province: 'Kalimantan Tengah', hotspots_24h: 7 }),
        region({ province: 'Kalimantan Tengah', hotspots_24h: 3 }),
      ],
      provinces,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      name: 'Kalimantan Tengah',
      hotspots_24h: 10,
      risk_category: 'sedang',
      center: [113, -2],
    })
  })

  it('keeps filter category when pinRisk set (Σ≥10 stays sedang)', () => {
    const rows = aggregateByProvince(
      [
        region({
          province: 'Kalimantan Tengah',
          hotspots_24h: 7,
          risk_category: 'sedang',
        }),
        region({
          province: 'Kalimantan Tengah',
          hotspots_24h: 5,
          risk_category: 'sedang',
        }),
      ],
      provinces,
      { pinRisk: 'sedang' },
    )
    expect(rows[0]).toMatchObject({
      hotspots_24h: 12,
      risk_category: 'sedang',
    })
  })
})
