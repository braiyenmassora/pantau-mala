/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProvinceChoroplethLayer } from '@/components/map/province-choropleth-layer'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

const addSource = vi.fn()
const addLayer = vi.fn()
const removeLayer = vi.fn()
const removeSource = vi.fn()
const getSource = vi.fn()
const getLayer = vi.fn()
const setPaintProperty = vi.fn()
const setFeatureState = vi.fn()
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
      setFeatureState,
      on,
      off,
      getCanvas,
    },
  }),
}))

vi.mock('@/data/province-boundaries', () => ({
  useProvinceBoundaries: () => ({
    data: {
      version: 1,
      geometry_sha256: 'mockhash',
      geometry: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '2388616',
            properties: { province_id: '2388616', province_name: 'Kalimantan Barat' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [108, -3],
                  [114, -3],
                  [114, 2],
                  [108, 2],
                  [108, -3],
                ],
              ],
            },
          },
        ],
      },
      provinces: [
        {
          id: '2388616',
          name: 'Kalimantan Barat',
          osm_name: 'Kalimantan Barat',
          osm_relation: 'https://www.openstreetmap.org/relation/2388616',
          retrieved_at: '2026-10-15T00:00:00Z',
          query: 'https://example.com',
          response_sha256: 'mock',
        },
      ],
    },
    isError: false,
  }),
}))

vi.mock('@/data/queries', () => ({
  useRegionCatalog: () => ({
    data: {
      provinces: [
        {
          code: '61',
          name: 'Kalimantan Barat',
          bbox: [108, -3, 114, 2],
          center: [111.0, 0.0],
        },
      ],
      regencies: [],
    },
  }),
  useMeta: () => ({
    data: {
      updated_at: '2026-10-18T00:00:00Z',
      status: { firms: 'ok', weather: 'ok', air: 'ok' },
    },
  }),
}))

const regions: Region[] = [
  {
    code: '61.01',
    name: 'Kab. Sambas',
    province: 'Kalimantan Barat',
    time_zone: 'WIB',
    center: [109.3, 1.3],
    weather_danger: null,
    risk_category: 'sangat_tinggi',
    hotspots_24h: 12,
    trend_7d: [0, 0, 0, 0, 0, 0, 12],
    weather: { temp_c: 31, condition: 'Cerah', humidity: 60, wind_kmh: 8, dry_days: 2 },
    air_quality: { pm25: 18, category: 'sedang' },
    last_detection: null,
    summary: '',
    actions: [],
  },
]

describe('ProvinceChoroplethLayer', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    addSource.mockClear()
    addLayer.mockClear()
    removeLayer.mockClear()
    removeSource.mockClear()
    setPaintProperty.mockClear()
    setFeatureState.mockClear()
    on.mockClear()
    off.mockClear()
    getSource.mockReturnValue(undefined)
    getLayer.mockReturnValue(undefined)
    useMapStore.setState({ province: 'Semua', selectedCode: null })
  })

  it('adds GeoJSON source with exact tolerance 0 and attaches fill layer under boundary_state', () => {
    getSource.mockReturnValue(undefined)
    addSource.mockImplementation(() => undefined)
    getLayer.mockImplementation((id: string) => {
      if (id === 'boundary_state') return {}
      return undefined
    })

    render(<ProvinceChoroplethLayer regions={regions} />)

    expect(addSource).toHaveBeenCalledWith(
      'province-choropleth-source',
      expect.objectContaining({
        type: 'geojson',
        tolerance: 0,
        promoteId: 'province_id',
      }),
    )
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'province-choropleth-fill',
        type: 'fill',
        source: 'province-choropleth-source',
      }),
      'boundary_state',
    )
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'province-choropleth-line',
        type: 'line',
        source: 'province-choropleth-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      }),
      'boundary_state',
    )
  })

  it('tears down listeners, layers, and source on unmount', () => {
    getLayer.mockImplementation((id: string) =>
      id === 'province-choropleth-fill' ? {} : undefined,
    )
    getSource.mockReturnValue({})

    const { unmount } = render(<ProvinceChoroplethLayer regions={regions} />)
    unmount()

    expect(off).toHaveBeenCalledWith(
      'click',
      'province-choropleth-fill',
      expect.any(Function),
    )
    expect(removeLayer).toHaveBeenCalledWith('province-choropleth-fill')
    expect(removeSource).toHaveBeenCalledWith('province-choropleth-source')
  })

  it('updates feature-state for enriched metrics without replacing source geometry', () => {
    getSource.mockReturnValue({})
    getLayer.mockReturnValue({})

    render(<ProvinceChoroplethLayer regions={regions} />)

    expect(setFeatureState).toHaveBeenCalledWith(
      { source: 'province-choropleth-source', id: '2388616' },
      expect.objectContaining({
        hotspots: 12,
        riskColor: '#D93025',
        fillMode: 1,
      }),
    )
  })

  it('colors green when province has only rendah (no sedang/tinggi), even if many hotspots', () => {
    getSource.mockReturnValue({})
    getLayer.mockReturnValue({})

    const rendahOnly: Region[] = [
      {
        ...regions[0]!,
        risk_category: 'rendah',
        hotspots_24h: 20,
      },
    ]

    render(<ProvinceChoroplethLayer regions={rendahOnly} />)

    expect(setFeatureState).toHaveBeenCalledWith(
      { source: 'province-choropleth-source', id: '2388616' },
      expect.objectContaining({
        hotspots: 20,
        riskColor: '#188038',
        fillMode: 1,
      }),
    )
  })

  it('marks zero-hotspot provinces gray (fillMode 2) when FIRMS ok', () => {
    getSource.mockReturnValue({})
    getLayer.mockReturnValue({})

    const zeroOnly: Region[] = [
      {
        ...regions[0]!,
        risk_category: 'rendah',
        hotspots_24h: 0,
      },
    ]

    render(<ProvinceChoroplethLayer regions={zeroOnly} />)

    expect(setFeatureState).toHaveBeenCalledWith(
      { source: 'province-choropleth-source', id: '2388616' },
      expect.objectContaining({
        hotspots: 0,
        riskColor: '#80868B',
        fillMode: 2,
      }),
    )
  })

  it('does not confirm empty fill when hotspot counts are missing', () => {
    getSource.mockReturnValue({})
    getLayer.mockReturnValue({})

    const missing: Region[] = [
      {
        ...regions[0]!,
        risk_category: 'tidak_tersedia',
        // @ts-expect-error — simulasi data gagal/null di luar schema ketat
        hotspots_24h: null,
      },
    ]

    render(<ProvinceChoroplethLayer regions={missing} />)

    expect(setFeatureState).toHaveBeenCalledWith(
      { source: 'province-choropleth-source', id: '2388616' },
      expect.objectContaining({
        hotspots: -1,
        riskColor: '#80868B',
        fillMode: 0,
      }),
    )
  })
})
