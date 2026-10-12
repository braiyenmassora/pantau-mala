import { useSession } from '@/auth/session'
/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LocationCard } from '@/components/panel/location-card'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

const region: Region = {
  code: '62.11',
  name: 'Kab. Pulang Pisau',
  province: 'Kalimantan Tengah',
  time_zone: 'WIB',
  center: [114.25, -2.75],
  weather_danger: { class: 'ekstrem', fwi: 40, source: 'BMKG' },
  risk_category: 'sangat_tinggi',
  hotspots_24h: 23,
  trend_7d: [8, 10, 9, 14, 15, 19, 23],
  weather: {
    temp_c: 34,
    condition: 'Cerah',
    humidity: 48,
    wind_kmh: 12,
    dry_days: 9,
  },
  air_quality: { pm25: 62, category: 'tidak_sehat' },
  last_detection: {
    time: '2026-10-09T13:55:00+07:00',
    satellite: 'MODIS Aqua',
    confidence: 'tinggi',
    frp_mw: 11.4,
  },
  summary: '',
  actions: [],
}

describe('LocationCard', () => {
  afterEach(() => cleanup())

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
    useMapStore.setState({
      location: { status: 'off' },
    })
  })

  it('shows nearby card with inline empty when active and no hotspots', () => {
    useMapStore.setState({
      location: { status: 'active', coords: { lon: 114.2, lat: -2.9 } },
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    client.setQueryData(['hotspots', '00000000-0000-4000-8000-000000000001', 0], {
      type: 'FeatureCollection',
      features: [],
    })

    render(
      <QueryClientProvider client={client}>
        <LocationCard regions={[region]} />
      </QueryClientProvider>,
    )

    expect(screen.getByText(copy.location.nearbyLabel)).toBeTruthy()
    expect(screen.getByText(copy.location.nearbyNoHotspots)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Lihat detail' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Matikan lokasi' })).toBeNull()
  })

  it('shows denied empty state', () => {
    useMapStore.setState({ location: { status: 'denied' } })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <LocationCard regions={[region]} />
      </QueryClientProvider>,
    )
    expect(screen.getByText(copy.empty.locationDenied.title)).toBeTruthy()
  })

  it('shows error empty with coba lagi', () => {
    useMapStore.setState({ location: { status: 'error' } })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <LocationCard regions={[region]} />
      </QueryClientProvider>,
    )
    expect(screen.getByText(copy.empty.locationError.title)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.empty.locationError.action }),
    ).toBeTruthy()
  })
})
