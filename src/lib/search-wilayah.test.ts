import { describe, expect, it } from 'vitest'

import type { DaftarWilayah, Region } from '@/data/types'
import { searchWilayah } from '@/lib/search-wilayah'

const daftar: DaftarWilayah = {
  _catatan: 'test',
  provinsi: [
    {
      kode: '81',
      nama: 'Maluku',
      bbox: [125.5, -8.5, 135.0, -2.5],
      pusat: [128.2, -3.7],
    },
    {
      kode: '62',
      nama: 'Kalimantan Tengah',
      bbox: [110.7, -3.6, 115.9, 0.8],
      pusat: [113.5, -1.7],
    },
  ],
  kabkota: [
    {
      kode: '81.71',
      nama: 'Kota Ambon',
      provinsi: 'Maluku',
      pusat: [128.18, -3.7],
      zona_waktu: 'WIT',
    },
    {
      kode: '81.01',
      nama: 'Kab. Maluku Tengah',
      provinsi: 'Maluku',
      pusat: [129.0, -3.2],
      zona_waktu: 'WIT',
    },
    {
      kode: '62.11',
      nama: 'Kab. Pulang Pisau',
      provinsi: 'Kalimantan Tengah',
      pusat: [114.25, -2.75],
      zona_waktu: 'WIB',
    },
  ],
}

const pulang: Region = {
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
    angin_kmj: 12,
    hari_tanpa_hujan: 9,
  },
  udara: { pm25: 62, kategori: 'tidak_sehat' },
  deteksi_terakhir: {
    waktu: '2026-10-09T13:55:00+07:00',
    satelit: 'MODIS Aqua',
    keyakinan: 'tinggi',
    frp_mw: 11.4,
  },
  ringkasan: '',
  saran: [],
}

describe('searchWilayah', () => {
  it('maluku → province + kab without hotspots', () => {
    const result = searchWilayah(daftar, [pulang], 'maluku')
    expect(result.provinces.some((p) => p.province.nama === 'Maluku')).toBe(true)
    expect(result.provinces.find((p) => p.province.nama === 'Maluku')?.hotspotCount).toBe(0)
    expect(result.kabkota.some((k) => k.kab.nama === 'Kab. Maluku Tengah')).toBe(true)
    expect(result.kabkota.find((k) => k.kab.nama.includes('Maluku'))?.region).toBeNull()
  })

  it('ambon → Kota Ambon without risk data', () => {
    const result = searchWilayah(daftar, [pulang], 'ambon')
    expect(result.kabkota).toHaveLength(1)
    expect(result.kabkota[0]?.kab.nama).toBe('Kota Ambon')
    expect(result.kabkota[0]?.region).toBeNull()
  })

  it('pulang → Pulang Pisau with score', () => {
    const result = searchWilayah(daftar, [pulang], 'pulang')
    expect(result.kabkota[0]?.region?.skor).toBe(82)
    expect(result.kabkota[0]?.kab.nama).toBe('Kab. Pulang Pisau')
  })

  it('dsds → tidak ditemukan', () => {
    const result = searchWilayah(daftar, [pulang], 'dsds')
    expect(result.provinces).toHaveLength(0)
    expect(result.kabkota).toHaveLength(0)
  })
})
