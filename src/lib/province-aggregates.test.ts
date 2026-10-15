import { describe, expect, it } from 'vitest'

import { aggregateByProvince, provinceLabelAnchors } from '@/lib/province-aggregates'
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

  it('sums trend_7d per province', () => {
    const rows = aggregateByProvince(
      [
        region({
          province: 'Kalimantan Tengah',
          hotspots_24h: 7,
          trend_7d: [1, 2, 3, 4, 5, 6, 7],
        }),
        region({
          province: 'Kalimantan Tengah',
          hotspots_24h: 3,
          trend_7d: [2, 1, 0, 1, 2, 3, 4],
        }),
      ],
      provinces,
    )
    expect(rows[0].trend_7d).toEqual([3, 3, 3, 5, 7, 9, 11])
  })
})

describe('provinceLabelAnchors', () => {
  it('uses the active BE region center instead of a synthetic province midpoint', () => {
    const catalog = {
      provinces: [provinces[0]],
      regencies: [
        {
          code: '62.01',
          name: 'Kab. A',
          province: 'Kalimantan Tengah',
          center: [114, -2.5] as [number, number],
          time_zone: 'WIB' as const,
        },
      ],
    }
    const anchors = provinceLabelAnchors(catalog, [
      region({
        code: '62.01',
        province: 'Kalimantan Tengah',
        hotspots_24h: 12,
        center: [114, -2.5],
      }),
    ])

    expect(anchors[0].center).toEqual([114, -2.5])
  })

  it('falls back to the nearest catalog regency for an inactive province', () => {
    const catalog = {
      provinces: [provinces[0]],
      regencies: [
        {
          code: '62.01',
          name: 'Kab. A',
          province: 'Kalimantan Tengah',
          center: [113.1, -2.1] as [number, number],
          time_zone: 'WIB' as const,
        },
      ],
    }

    expect(provinceLabelAnchors(catalog)[0].center).toEqual([113.1, -2.1])
  })
})
