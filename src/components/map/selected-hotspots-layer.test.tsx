import { useSession } from '@/auth/session'
/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SelectedHotspotsLayer } from '@/components/map/selected-hotspots-layer'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

vi.mock('@/components/ui/map', () => ({
  useMap: () => ({
    map: {
      flyTo: vi.fn(),
      fitBounds: vi.fn(),
      setMaxBounds: vi.fn(),
      stop: vi.fn(),
      getSource: vi.fn(),
      addSource: vi.fn(),
      getLayer: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
    },
    isLoaded: true,
  }),
  MapMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hotspot-marker">{children}</div>
  ),
  MarkerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}))

const region: Region = {
  code: 'IDN.1.1_1',
  name: 'Kab. Tes',
  province: 'Kalimantan Tengah',
  time_zone: 'WIB',
  center: [110, -7],
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

describe('SelectedHotspotsLayer', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useSession.setState({
      status: 'authenticated',
      token: 'pms_synthetic-test-only',
      principal: {
        client_id: '00000000-0000-4000-8000-000000000001',
        client_slug: 'fixture',
        username: 'fixture',
        role: 'reader',
      },
      generation: 0,
    })
    useMapStore.setState({ selectedCode: null, province: 'Semua', reportHotspot: null })
  })

  it('skips DOM markers when many hotspots (heatmap-only)', () => {
    useMapStore.setState({ selectedCode: 'IDN.1.1_1', province: 'Semua' })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    client.setQueryData(['hotspots', '00000000-0000-4000-8000-000000000001', 0], {
      type: 'FeatureCollection',
      features: Array.from({ length: 80 }, (_, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [110 + i * 0.01, -7] },
        properties: {
          time: `2026-10-11T00:00:${String(i).padStart(2, '0')}Z`,
          satellite: 'VIIRS',
          confidence: 'tinggi',
          frp_mw: 1,
          region_code: 'IDN.1.1_1',
        },
      })),
    })
    render(
      <QueryClientProvider client={client}>
        <SelectedHotspotsLayer regions={[region]} />
      </QueryClientProvider>,
    )
    expect(screen.queryByTestId('hotspot-marker')).toBeNull()
  })

  it('uses DOM markers when few hotspots', () => {
    useMapStore.setState({ selectedCode: 'IDN.1.1_1', province: 'Semua' })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    client.setQueryData(['hotspots', '00000000-0000-4000-8000-000000000001', 0], {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [110.1, -7.1] },
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
        <SelectedHotspotsLayer regions={[region]} />
      </QueryClientProvider>,
    )
    expect(screen.getAllByTestId('hotspot-marker')).toHaveLength(1)
    const marker = screen.getByRole('button', { name: /Titik panas/ })
    expect(marker.className).toContain('size-11')
    fireEvent.click(marker)
    expect(useMapStore.getState().reportHotspot).toMatchObject({
      lat: -7.1,
      lon: 110.1,
      time: '2026-10-11T00:00:00Z',
    })
  })
})
