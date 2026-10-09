import { describe, expect, it } from 'vitest'

import {
  parseDaftarWilayah,
  parseHotspots,
  parseMeta,
  parseRegions,
} from '@/data/schema'

describe('data schemas', () => {
  it('rejects broken wilayah payload', () => {
    expect(() => parseRegions([{ kode: '1' }])).toThrow()
  })

  it('rejects broken meta payload', () => {
    expect(() => parseMeta({ diperbarui: 'x' })).toThrow()
  })

  it('rejects broken hotspot collection', () => {
    expect(() =>
      parseHotspots({ type: 'FeatureCollection', features: [{ type: 'Feature' }] }),
    ).toThrow()
  })

  it('accepts minimal valid daftar-wilayah', () => {
    const data = parseDaftarWilayah({
      provinsi: [
        {
          kode: '31',
          nama: 'DKI Jakarta',
          bbox: [106, -7, 107, -5],
          pusat: [106.8, -6.2],
        },
      ],
      kabkota: [
        {
          kode: '31.71',
          nama: 'Kota Jakarta Pusat',
          provinsi: 'DKI Jakarta',
          pusat: [106.84, -6.18],
          zona_waktu: 'WIB',
        },
      ],
    })
    expect(data.kabkota).toHaveLength(1)
  })
})
