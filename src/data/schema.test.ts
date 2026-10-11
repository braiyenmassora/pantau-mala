import { describe, expect, it } from 'vitest'

import { parseRegionCatalog, parseHotspots, parseMeta, parseRegions } from '@/data/schema'

describe('data schemas', () => {
  it('rejects broken wilayah payload', () => {
    expect(() => parseRegions([{ code: '1' }])).toThrow()
  })

  it('rejects broken meta payload', () => {
    expect(() => parseMeta({ updated_at: 'x' })).toThrow()
  })

  it('rejects broken hotspot collection', () => {
    expect(() =>
      parseHotspots({ type: 'FeatureCollection', features: [{ type: 'Feature' }] }),
    ).toThrow()
  })

  it('accepts minimal valid region-catalog', () => {
    const data = parseRegionCatalog({
      provinces: [
        {
          code: '31',
          name: 'DKI Jakarta',
          bbox: [106, -7, 107, -5],
          center: [106.8, -6.2],
        },
      ],
      regencies: [
        {
          code: '31.71',
          name: 'Kota Jakarta Pusat',
          province: 'DKI Jakarta',
          center: [106.84, -6.18],
          time_zone: 'WIB',
        },
      ],
    })
    expect(data.regencies).toHaveLength(1)
  })

  it('accepts null optional strings from live API', () => {
    const [region] = parseRegions([
      {
        code: '62.11',
        name: 'Kab. Pulang Pisau',
        province: 'Kalimantan Tengah',
        time_zone: 'WIB',
        center: [114.25, -2.75],
        risk_category: 'sangat_tinggi',
        weather_danger: { class: 'ekstrem', fwi: 34.5, source: 'FWI dihitung' },
        hotspots_24h: 18,
        trend_7d: [0, 0, 1, 1, 1, 1, 18],
        weather: {
          temp_c: 30,
          condition: 'Cerah',
          humidity: 50,
          wind_kmh: 5,
          dry_days: 1,
        },
        air_quality: { pm25: 10, category: 'baik' },
        last_detection: {
          time: '2026-10-11T01:07:00+00:00',
          satellite: 'MODIS',
          confidence: 'sedang',
          frp_mw: 14.91,
          village: null,
          district: null,
        },
        summary: '',
        actions: [],
      },
    ])
    expect(region?.last_detection.village).toBeUndefined()
    expect(region?.last_detection.district).toBeUndefined()

    const hotspots = parseHotspots({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [114.2, -2.9] },
          properties: {
            time: '2026-10-11T03:32:00+00:00',
            satellite: 'VIIRS S-NPP',
            confidence: 'sedang',
            frp_mw: 5.54,
            region_code: null,
          },
        },
      ],
    })
    expect(hotspots.features[0]?.properties.region_code).toBeUndefined()
  })
})
