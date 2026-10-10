/** @vitest-environment node */
import { featureCollection, point } from '@turf/helpers'
import { describe, expect, it } from 'vitest'

import type { HotspotFeature, Region } from '@/data/types'
import { computeHotspotAreas } from '@/lib/hotspot-areas'

function pt(
  lon: number,
  lat: number,
  kode: string,
  waktu = '2026-10-09T12:00:00+07:00',
): HotspotFeature {
  return point([lon, lat], {
    waktu,
    satelit: 'VIIRS NOAA-20',
    keyakinan: 'tinggi' as const,
    frp_mw: 8,
    kode_wilayah: kode,
  }) as HotspotFeature
}

/** ~500 m east of (114.25, -2.75) ≈ +0.0045° lon near equator. */
const STEP = 0.0045

const stubWilayah = [
  {
    kode: '62.11',
    nama: 'Kab. Pulang Pisau',
    kategori: 'sangat_tinggi',
  },
  {
    kode: '16.02',
    nama: 'Kab. OKI',
    kategori: 'sedang',
  },
] as unknown as Region[]

describe('computeHotspotAreas', () => {
  it('makes 1 polygon from 5 points ~500 m apart', () => {
    const base: [number, number] = [114.25, -2.75]
    const features = Array.from({ length: 5 }, (_, i) =>
      pt(base[0] + i * STEP, base[1], '62.11'),
    )
    const areas = computeHotspotAreas(featureCollection(features), stubWilayah)
    expect(areas.features).toHaveLength(1)
    expect(areas.features[0]!.properties.jumlah_titik).toBe(5)
    expect(areas.features[0]!.properties.kategori).toBe('sangat_tinggi')
    expect(areas.features[0]!.properties.luas_km2).toBeGreaterThan(0)
  })

  it('makes no polygon from only 2 points', () => {
    const features = [
      pt(114.25, -2.75, '62.11'),
      pt(114.25 + STEP, -2.75, '62.11'),
    ]
    const areas = computeHotspotAreas(featureCollection(features), stubWilayah)
    expect(areas.features).toHaveLength(0)
  })

  it('makes 2 polygons from two clusters 10 km apart', () => {
    const a: [number, number] = [114.25, -2.75]
    const b: [number, number] = [114.34, -2.75] // ~10 km east
    const features = [
      ...Array.from({ length: 4 }, (_, i) => pt(a[0] + i * STEP, a[1], '62.11')),
      ...Array.from({ length: 4 }, (_, i) =>
        pt(b[0] + i * STEP, b[1], '16.02', '2026-10-09T13:00:00+07:00'),
      ),
    ]
    const areas = computeHotspotAreas(featureCollection(features), stubWilayah)
    expect(areas.features).toHaveLength(2)
    const kodes = areas.features.map((f) => f.properties.kode_wilayah).sort()
    expect(kodes).toEqual(['16.02', '62.11'])
  })

  it('ignores keyakinan rendah', () => {
    const features = Array.from({ length: 5 }, (_, i) => {
      const f = pt(114.25 + i * STEP, -2.75, '62.11')
      f.properties.keyakinan = 'rendah'
      return f
    })
    const areas = computeHotspotAreas(featureCollection(features), stubWilayah)
    expect(areas.features).toHaveLength(0)
  })
})
