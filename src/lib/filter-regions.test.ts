import { describe, expect, it } from 'vitest'

import type { Region } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'

function stub(
  partial: Partial<Region> &
    Pick<Region, 'code' | 'name' | 'risk_category' | 'hotspots_24h'>,
): Region {
  return {
    province: 'Kalimantan Tengah',
    time_zone: 'WIB',
    center: [114.25, -2.75],
    weather_danger: { class: 'aman', fwi: 5, source: 'BMKG' },
    trend_7d: [1, 1, 1, 1, 1, 1, partial.hotspots_24h],
    weather: {
      temp_c: 30,
      condition: 'Cerah',
      humidity: 60,
      wind_kmh: 10,
      dry_days: 2,
    },
    air_quality: { pm25: 10, category: 'baik' },
    last_detection: {
      time: '2026-10-09T13:55:00+07:00',
      satellite: 'MODIS Aqua',
      confidence: 'tinggi',
      frp_mw: 2,
    },
    summary: 'x',
    actions: [],
    ...partial,
  }
}

const sample: Region[] = [
  stub({
    code: '62.11',
    name: 'Kab. Pulang Pisau',
    risk_category: 'sangat_tinggi',
    hotspots_24h: 23,
    weather_danger: { class: 'ekstrem', fwi: 42, source: 'BMKG' },
  }),
  stub({
    code: '64.02',
    name: 'Kab. Kutai Kartanegara',
    province: 'Kalimantan Timur',
    risk_category: 'sedang',
    hotspots_24h: 8,
    weather_danger: { class: 'waspada', fwi: 11, source: 'BMKG' },
  }),
  stub({
    code: '61.12',
    name: 'Kab. Kubu Raya',
    province: 'Kalimantan Barat',
    risk_category: 'rendah',
    hotspots_24h: 0,
    weather_danger: { class: 'aman', fwi: 2, source: 'BMKG' },
  }),
]

describe('filterRegions', () => {
  it('sorts by kategori then titik panas; includes rendah', () => {
    const result = filterRegions(sample, {
      province: 'Semua',
      selectedCategories: new Set(),
      query: '',
    })
    expect(result.map((r) => r.code)).toEqual(['62.11', '64.02', '61.12'])
  })

  it('filters by province', () => {
    const result = filterRegions(sample, {
      province: 'Kalimantan Timur',
      selectedCategories: new Set(),
      query: '',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.code).toBe('64.02')
  })

  it('filters by selected categories', () => {
    const result = filterRegions(sample, {
      province: 'Semua',
      selectedCategories: new Set(['sedang']),
      query: '',
    })
    expect(result.map((r) => r.code)).toEqual(['64.02'])
  })

  it('keeps rendah when that chip is selected', () => {
    const result = filterRegions(sample, {
      province: 'Semua',
      selectedCategories: new Set(['rendah']),
      query: '',
    })
    expect(result.map((r) => r.code)).toEqual(['61.12'])
  })

  it('searches names with Fuse.js', () => {
    const result = filterRegions(sample, {
      province: 'Semua',
      selectedCategories: new Set(),
      query: 'pulang',
    })
    expect(result.map((r) => r.code)).toEqual(['62.11'])
  })

  it('derives map risk from hotspots when API kategori is null/tidak_tersedia', () => {
    const live = [
      stub({
        code: '35.17',
        name: 'Jombang',
        risk_category: 'tidak_tersedia',
        hotspots_24h: 11,
      }),
      stub({
        code: '35.01',
        name: 'Pacitan',
        risk_category: 'tidak_tersedia',
        hotspots_24h: 4,
      }),
      stub({
        code: '35.99',
        name: 'Kosong',
        risk_category: 'tidak_tersedia',
        hotspots_24h: 0,
      }),
    ]
    const result = filterRegions(live, {
      province: 'Semua',
      selectedCategories: new Set(),
      query: '',
    })
    // 11 → sangat tinggi, 4 → sedang, 0 → rendah (tetap masuk daftar)
    expect(result.map((r) => r.code)).toEqual(['35.17', '35.01', '35.99'])
  })
})
