/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProvinceRadarsLayer } from '@/components/map/province-radars-layer'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

const addSource = vi.fn()
const addLayer = vi.fn()
const removeLayer = vi.fn()
const removeSource = vi.fn()
const setData = vi.fn()
const setPaintProperty = vi.fn()
const getSource = vi.fn()
const getLayer = vi.fn()
const on = vi.fn()
const off = vi.fn()
const getCanvas = vi.fn(() => ({ style: {} }))

vi.mock('@/components/ui/map', () => ({
  useMap: () => ({
    isLoaded: true,
    map: {
      addSource,
      addLayer,
      removeLayer,
      removeSource,
      getSource,
      getLayer,
      setPaintProperty,
      on,
      off,
      getCanvas,
    },
  }),
}))

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}))

vi.mock('@/data/queries', () => ({
  useRegionCatalog: () => ({
    data: {
      provinces: [
        {
          code: '64',
          name: 'Kalimantan Timur',
          bbox: [113, -3, 119, 3],
          center: [116.5, 0.5],
        },
        {
          code: '62',
          name: 'Kalimantan Tengah',
          bbox: [110, -4, 116, 1],
          center: [113.5, -1.5],
        },
        {
          code: '31',
          name: 'DKI Jakarta',
          bbox: [106.6, -6.4, 107.0, -6.0],
          center: [106.8, -6.2],
        },
      ],
      regencies: [],
    },
  }),
}))

const regions: Region[] = [
  {
    code: '64.01',
    name: 'Kab. Paser',
    province: 'Kalimantan Timur',
    time_zone: 'WITA',
    center: [116.0, -1.8],
    weather_danger: null,
    risk_category: 'sangat_tinggi',
    hotspots_24h: 180,
    trend_7d: [0, 0, 0, 0, 0, 20, 180],
    weather: { temp_c: 32, condition: 'Cerah', humidity: 55, wind_kmh: 10, dry_days: 6 },
    air_quality: { pm25: 75, category: 'tidak_sehat' },
    last_detection: null,
    summary: '',
    actions: [],
  },
  {
    code: '62.01',
    name: 'Kab. Kotawaringin Barat',
    province: 'Kalimantan Tengah',
    time_zone: 'WIB',
    center: [111.6, -2.4],
    weather_danger: null,
    risk_category: 'sedang',
    hotspots_24h: 8,
    trend_7d: [0, 0, 0, 0, 0, 2, 8],
    weather: { temp_c: 30, condition: 'Berawan', humidity: 70, wind_kmh: 8, dry_days: 3 },
    air_quality: { pm25: 35, category: 'sedang' },
    last_detection: null,
    summary: '',
    actions: [],
  },
  {
    code: '31.01',
    name: 'Kepulauan Seribu',
    province: 'DKI Jakarta',
    time_zone: 'WIB',
    center: [106.8, -6.2],
    weather_danger: null,
    risk_category: 'rendah',
    hotspots_24h: 0,
    trend_7d: [0, 0, 0, 0, 0, 0, 0],
    weather: { temp_c: 29, condition: 'Cerah', humidity: 65, wind_kmh: 6, dry_days: 0 },
    air_quality: { pm25: 20, category: 'baik' },
    last_detection: null,
    summary: '',
    actions: [],
  },
]

describe('ProvinceRadarsLayer', () => {
  afterEach(cleanup)

  beforeEach(() => {
    addSource.mockClear()
    addLayer.mockClear()
    removeLayer.mockClear()
    removeSource.mockClear()
    setData.mockClear()
    setPaintProperty.mockClear()
    on.mockClear()
    off.mockClear()
    getSource.mockReturnValue(undefined)
    getLayer.mockReturnValue(undefined)
    useMapStore.setState({ province: 'Semua', selectedCode: null })
  })

  it('renders static radar rings for active provinces and hides them when drilled in', () => {
    const sources = new Map<string, { setData: typeof setData }>()
    getSource.mockImplementation((id: string) => sources.get(id))
    addSource.mockImplementation((id: string) => {
      sources.set(id, { setData })
    })

    const { rerender } = render(<ProvinceRadarsLayer regions={regions} />)

    expect(addSource).toHaveBeenCalledWith(
      'province-radars-source',
      expect.objectContaining({ type: 'geojson' }),
    )
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'province-radars-pulse-high',
        type: 'circle',
      }),
    )
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'province-radars-pulse-mid',
        type: 'circle',
      }),
    )
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'province-radars-center-dot',
        type: 'circle',
      }),
    )

    expect(setData).toHaveBeenCalledWith(
      expect.objectContaining({
        features: [
          expect.objectContaining({
            properties: expect.objectContaining({
              name: 'Kalimantan Timur',
              risk_rank: 3,
            }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({
              name: 'Kalimantan Tengah',
              risk_rank: 2,
            }),
          }),
        ],
      }),
    )

    // Saat drill-in ke Kalimantan Timur, radar nasional kosong (pindah ke micro view)
    useMapStore.setState({ province: 'Kalimantan Timur', selectedCode: null })
    rerender(<ProvinceRadarsLayer regions={regions} />)

    expect(setData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        features: [],
      }),
    )
  })
})
