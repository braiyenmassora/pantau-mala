import { describe, expect, it } from 'vitest'

import type { RegionCatalog, Region } from '@/data/types'
import { searchWilayah } from '@/lib/search-wilayah'

const daftar: RegionCatalog = {
  note: 'test',
  provinces: [
    {
      code: '81',
      name: 'Maluku',
      bbox: [125.5, -8.5, 135.0, -2.5],
      center: [128.2, -3.7],
    },
    {
      code: '62',
      name: 'Kalimantan Tengah',
      bbox: [110.7, -3.6, 115.9, 0.8],
      center: [113.5, -1.7],
    },
  ],
  regencies: [
    {
      code: '81.71',
      name: 'Kota Ambon',
      province: 'Maluku',
      center: [128.18, -3.7],
      time_zone: 'WIT',
    },
    {
      code: '81.01',
      name: 'Kab. Maluku Tengah',
      province: 'Maluku',
      center: [129.0, -3.2],
      time_zone: 'WIT',
    },
    {
      code: '62.11',
      name: 'Kab. Pulang Pisau',
      province: 'Kalimantan Tengah',
      center: [114.25, -2.75],
      time_zone: 'WIB',
    },
  ],
}

const pulang: Region = {
  code: '62.11',
  name: 'Kab. Pulang Pisau',
  province: 'Kalimantan Tengah',
  time_zone: 'WIB',
  center: [114.25, -2.75],
  weather_danger: { class: 'ekstrem', fwi: 40, source: 'BMKG' },
  risk_category: 'sangat_tinggi',
  hotspots_24h: 23,
  trend_7d: [8, 10, 9, 14, 15, 19, 23],
  weather: {
    temp_c: 34,
    condition: 'Cerah',
    humidity: 48,
    wind_kmh: 12,
    dry_days: 9,
  },
  air_quality: { pm25: 62, category: 'tidak_sehat' },
  last_detection: {
    time: '2026-10-09T13:55:00+07:00',
    satellite: 'MODIS Aqua',
    confidence: 'tinggi',
    frp_mw: 11.4,
  },
  summary: '',
  actions: [],
}

describe('searchWilayah', () => {
  it('maluku → province + kab without hotspots', () => {
    const result = searchWilayah(daftar, [pulang], 'maluku')
    expect(result.provinces.some((p) => p.province.name === 'Maluku')).toBe(true)
    expect(result.provinces.find((p) => p.province.name === 'Maluku')?.hotspotCount).toBe(
      0,
    )
    expect(result.kabkota.some((k) => k.kab.name === 'Kab. Maluku Tengah')).toBe(true)
    expect(result.kabkota.find((k) => k.kab.name.includes('Maluku'))?.region).toBeNull()
  })

  it('ambon → Kota Ambon without risk data', () => {
    const result = searchWilayah(daftar, [pulang], 'ambon')
    expect(result.kabkota).toHaveLength(1)
    expect(result.kabkota[0]?.kab.name).toBe('Kota Ambon')
    expect(result.kabkota[0]?.region).toBeNull()
  })

  it('pulang → Pulang Pisau with risk data', () => {
    const result = searchWilayah(daftar, [pulang], 'pulang')
    expect(result.kabkota[0]?.region?.risk_category).toBe('sangat_tinggi')
    expect(result.kabkota[0]?.region?.weather_danger?.class).toBe('ekstrem')
    expect(result.kabkota[0]?.kab.name).toBe('Kab. Pulang Pisau')
  })

  it('dsds → tidak ditemukan', () => {
    const result = searchWilayah(daftar, [pulang], 'dsds')
    expect(result.provinces).toHaveLength(0)
    expect(result.kabkota).toHaveLength(0)
  })
})
