/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProvinceLabelsLayer } from '@/components/map/province-labels-layer'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

const addSource = vi.fn()
const addLayer = vi.fn()
const setData = vi.fn()
const getSource = vi.fn()
const getLayer = vi.fn()

vi.mock('@/components/ui/map', () => ({
  useMap: () => ({
    isLoaded: true,
    map: {
      addSource,
      addLayer,
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
      getSource,
      getLayer,
    },
  }),
}))

vi.mock('@/data/queries', () => ({
  useRegionCatalog: () => ({
    data: {
      provinces: [
        {
          code: '62',
          name: 'Kalimantan Tengah',
          bbox: [110, -4, 116, -1],
          center: [113.4, -2.2],
        },
        {
          code: '61',
          name: 'Kalimantan Barat',
          bbox: [108, -3, 114, 2],
          center: [111.0, 0.0],
        },
        {
          code: '63',
          name: 'Kalimantan Selatan',
          bbox: [114, -4, 116, -2],
          center: [115.0, -3.0],
        },
      ],
      regencies: [],
    },
  }),
}))

const regions: Region[] = [
  {
    code: '62.01',
    name: 'Kab. Tes',
    province: 'Kalimantan Tengah',
    time_zone: 'WIB',
    center: [113, -2],
    weather_danger: null,
    risk_category: 'sangat_tinggi',
    hotspots_24h: 10,
    trend_7d: [0, 0, 0, 0, 0, 0, 10],
    weather: { temp_c: 30, condition: 'Cerah', humidity: 50, wind_kmh: 5, dry_days: 1 },
    air_quality: { pm25: 10, category: 'baik' },
    last_detection: null,
    summary: '',
    actions: [],
  },
]

describe('ProvinceLabelsLayer', () => {
  afterEach(cleanup)

  beforeEach(() => {
    addSource.mockClear()
    addLayer.mockClear()
    setData.mockClear()
    getSource.mockReturnValue(undefined)
    getLayer.mockReturnValue(undefined)
    useMapStore.setState({ province: 'Semua', selectedCode: null })
  })

  it('adds symbol layer with province names on national view', () => {
    let hasSource = false
    getSource.mockImplementation(() => {
      if (!hasSource) return undefined
      return { setData }
    })
    addSource.mockImplementation(() => {
      hasSource = true
    })

    render(<ProvinceLabelsLayer regions={regions} />)

    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'province-labels-layer',
        type: 'symbol',
        layout: expect.objectContaining({ 'text-font': ['Open Sans Regular'] }),
      }),
    )
    expect(setData).toHaveBeenCalledWith(
      expect.objectContaining({
        features: expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ name: 'Kalimantan Tengah' }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({ name: 'Kalimantan Barat' }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({ name: 'Kalimantan Selatan' }),
          }),
        ]),
      }),
    )
  })

  it('clears labels when a province is selected', () => {
    useMapStore.setState({ province: 'Kalimantan Tengah', selectedCode: null })
    let hasSource = false
    getSource.mockImplementation(() => {
      if (!hasSource) return undefined
      return { setData }
    })
    addSource.mockImplementation(() => {
      hasSource = true
    })

    render(<ProvinceLabelsLayer regions={regions} />)

    expect(setData).toHaveBeenCalledWith(expect.objectContaining({ features: [] }))
  })
})
