import { describe, expect, it } from 'vitest'

import type { Region } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'

const sample: Region[] = [
  {
    kode: '62.11',
    nama: 'Kab. Pulang Pisau',
    provinsi: 'Kalimantan Tengah',
    zona_waktu: 'WIB',
    pusat: [114.25, -2.75],
    skor: 82,
    kategori: 'sangat_tinggi',
    titik_panas_24j: 23,
    tren_7h: [8, 10, 9, 14, 15, 19, 23],
    cuaca: {
      suhu_c: 34,
      kondisi: 'Cerah',
      kelembapan: 48,
      angin_kmj: 14,
      hari_tanpa_hujan: 9,
    },
    udara: { pm25: 92.4, kategori: 'tidak_sehat' },
    deteksi_terakhir: {
      waktu: '2026-10-09T13:55:00+07:00',
      satelit: 'MODIS Aqua',
      keyakinan: 'tinggi',
      frp_mw: 11.4,
    },
    ringkasan: 'x',
    saran: [],
  },
  {
    kode: '64.02',
    nama: 'Kab. Kutai Kartanegara',
    provinsi: 'Kalimantan Timur',
    zona_waktu: 'WITA',
    pusat: [116.8, -0.4],
    skor: 29,
    kategori: 'rendah',
    titik_panas_24j: 3,
    tren_7h: [3, 2, 3, 3, 2, 3, 3],
    cuaca: {
      suhu_c: 31,
      kondisi: 'Hujan ringan',
      kelembapan: 74,
      angin_kmj: 9,
      hari_tanpa_hujan: 1,
    },
    udara: { pm25: 12.6, kategori: 'baik' },
    deteksi_terakhir: {
      waktu: '2026-10-09T13:55:00+08:00',
      satelit: 'VIIRS SNPP',
      keyakinan: 'sedang',
      frp_mw: 2.1,
    },
    ringkasan: 'y',
    saran: [],
  },
]

describe('filterRegions', () => {
  it('sorts by score descending and returns all when filters are empty', () => {
    const result = filterRegions(sample, {
      province: 'Semua',
      selectedCategories: new Set(),
      query: '',
    })
    expect(result.map((r) => r.kode)).toEqual(['62.11', '64.02'])
  })

  it('filters by province', () => {
    const result = filterRegions(sample, {
      province: 'Kalimantan Timur',
      selectedCategories: new Set(),
      query: '',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.kode).toBe('64.02')
  })

  it('filters by selected categories', () => {
    const result = filterRegions(sample, {
      province: 'Semua',
      selectedCategories: new Set(['rendah']),
      query: '',
    })
    expect(result.map((r) => r.kode)).toEqual(['64.02'])
  })

  it('searches names with Fuse.js', () => {
    const result = filterRegions(sample, {
      province: 'Semua',
      selectedCategories: new Set(),
      query: 'pulang',
    })
    expect(result.map((r) => r.kode)).toEqual(['62.11'])
  })
})
