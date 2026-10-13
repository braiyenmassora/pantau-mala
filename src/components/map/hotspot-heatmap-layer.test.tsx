/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  HotspotHeatmapLayer,
  HEATMAP_MIN_ZOOM,
} from '@/components/map/hotspot-heatmap-layer'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

vi.mock('@/data/queries', () => ({
  useHotspots: () => ({ data: { type: 'FeatureCollection', features: [{
    type: 'Feature', geometry: { type: 'Point', coordinates: [140.1, -8.1] },
    properties: { time: '2026-10-11T00:00:00Z', satellite: 'VIIRS', confidence: 'tinggi', frp_mw: 1, region_code: 'IDN.1.1_1' },
  }] } }),
}))

const addSource = vi.fn()
const addLayer = vi.fn()
const removeLayer = vi.fn()
const removeSource = vi.fn()
const setData = vi.fn()
const getSource = vi.fn()
const getLayer = vi.fn()

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
    },
  }),
}))

const region: Region = {
  code: 'IDN.1.1_1',
  name: 'Kab. Tes',
  province: 'Papua',
  time_zone: 'WIT',
  center: [140, -8],
  weather_danger: { class: 'aman', fwi: 1, source: 'FWI dihitung' },
  risk_category: 'sangat_tinggi',
  hotspots_24h: 2,
  trend_7d: [0, 0, 0, 0, 0, 0, 2],
  weather: {
    temp_c: 30,
    condition: 'Cerah',
    humidity: 50,
    wind_kmh: 5,
    dry_days: 1,
  },
  air_quality: { pm25: 10, category: 'baik' },
  last_detection: {
    time: '2026-10-11T00:00:00Z',
    satellite: 'VIIRS',
    confidence: 'tinggi',
    frp_mw: 1,
  },
  summary: '',
  actions: ['x'],
}

describe('HotspotHeatmapLayer', () => {
  afterEach(cleanup)

  beforeEach(() => {
    addSource.mockClear()
    addLayer.mockClear()
    setData.mockClear()
    getSource.mockReturnValue(undefined)
    getLayer.mockReturnValue(undefined)
    useMapStore.setState({ selectedCode: null, province: 'Semua' })
  })

  it('adds heatmap source/layer from existing hotspots', () => {
    let hasSource = false
    getSource.mockImplementation(() => {
      if (!hasSource) return undefined
      return { setData }
    })
    addSource.mockImplementation(() => {
      hasSource = true
    })
    getLayer.mockReturnValue(undefined)

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    client.setQueryData(['hotspots'], {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [140.1, -8.1] },
          properties: {
            time: '2026-10-11T00:00:00Z',
            satellite: 'VIIRS',
            confidence: 'tinggi',
            frp_mw: 1,
            region_code: 'IDN.1.1_1',
          },
        },
      ],
    })

    render(
      <QueryClientProvider client={client}>
        <HotspotHeatmapLayer regions={[{ ...region, risk_category: 'tidak_tersedia', quality: 'stale' }]} />
      </QueryClientProvider>,
    )

    expect(addSource).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ data: expect.objectContaining({ features: expect.arrayContaining([expect.objectContaining({ properties: expect.objectContaining({ weight: 1 }) })]) }) }))
    expect(HEATMAP_MIN_ZOOM).toBe(0)
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'heatmap',
        minzoom: HEATMAP_MIN_ZOOM,
      }),
    )
  })
})
