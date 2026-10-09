import { describe, expect, it } from 'vitest'

import type { HotspotFeature, Region } from '@/data/types'
import { computeNearby } from '@/lib/nearby'

function hotspot(
  lon: number,
  lat: number,
  keyakinan: HotspotFeature['properties']['keyakinan'],
  kode_wilayah: string,
): HotspotFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      waktu: '2026-10-09T00:00:00+07:00',
      satelit: 'VIIRS',
      keyakinan,
      frp_mw: 1,
      kode_wilayah,
    },
  }
}

function region(kode: string, lon: number, lat: number): Region {
  return {
    kode,
    nama: kode,
    provinsi: 'x',
    zona_waktu: 'WIB',
    pusat: [lon, lat],
    skor: 1,
    kategori: 'rendah',
    titik_panas_24j: 1,
    tren_7h: [0, 0, 0, 0, 0, 0, 0],
    cuaca: {
      suhu_c: 30,
      kondisi: 'Cerah',
      kelembapan: 50,
      angin_kmj: 5,
      hari_tanpa_hujan: 1,
    },
    udara: { pm25: 10, kategori: 'baik' },
    deteksi_terakhir: {
      waktu: '2026-10-09T00:00:00+07:00',
      satelit: 'VIIRS',
      keyakinan: 'tinggi',
      frp_mw: 1,
    },
    ringkasan: '',
    saran: [],
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
      [region('A', 114.2, -2.9)],
    )
    expect(result.hotspotCount).toBe(2)
    expect(result.nearest?.regionCode).toBe('A')
    expect(result.nearest?.distanceKm).toBeGreaterThan(0)
  })

  it('rounds nearest distance to 1 decimal', () => {
    const result = computeNearby(
      USER,
      [hotspot(114.29, -2.9, 'tinggi', 'A')],
      [],
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
})
