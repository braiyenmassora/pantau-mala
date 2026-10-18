import { useSession } from '@/auth/session'
/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LocationCard } from '@/components/panel/location-card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

function wrap(ui: ReactNode) {
  return <TooltipProvider>{ui}</TooltipProvider>
}

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

function renderCard(regions: Region[] = [region]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['hotspots', '00000000-0000-4000-8000-000000000001', 0], {
    type: 'FeatureCollection',
    features: [],
  })
  return render(
    wrap(
      <QueryClientProvider client={client}>
        <LocationCard regions={regions} />
      </QueryClientProvider>,
    ),
  )
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

  it('shows default zero count when active and no hotspots', () => {
    useMapStore.setState({
      location: { status: 'active', coords: { lon: 114.2, lat: -2.9 } },
    })
    renderCard()

    expect(screen.getByText('0')).toBeTruthy()
    expect(screen.getByText(copy.location.hotspotUnitLine)).toBeTruthy()
    expect(screen.queryByText(copy.location.nearbyNoHotspots)).toBeNull()
    expect(screen.queryByText(copy.panel.coverageNote)).toBeNull()
    expect(
      screen.queryByRole('button', { name: copy.location.searchManual }),
    ).toBeNull()
  })

  it('shows default zero count when far from coverage', () => {
    useMapStore.setState({
      // Di daratan Indonesia longgar tapi jauh dari pusat kab uji
      location: { status: 'active', coords: { lon: 95.3, lat: 5.5 } },
    })
    renderCard()

    expect(screen.getByText('0')).toBeTruthy()
    expect(screen.getByText(copy.location.hotspotUnitLine)).toBeTruthy()
    expect(screen.queryByText(copy.location.nearbyFar)).toBeNull()
    expect(
      screen.queryByRole('button', { name: copy.location.searchManual }),
    ).toBeNull()
  })

  it('shows denied state with retry and search', () => {
    useMapStore.setState({ location: { status: 'denied' } })
    renderCard()
    expect(screen.getByText(copy.location.deniedBody)).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.location.useLocation })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.location.searchManual }),
    ).toBeTruthy()
  })

  it('shows error empty with coba lagi and search', () => {
    useMapStore.setState({ location: { status: 'error' } })
    renderCard()
    expect(screen.getByText(copy.location.errorBody)).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.location.tryAgain })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.location.searchManual }),
    ).toBeTruthy()
  })

  it('shows timeout with coba lagi and search', () => {
    useMapStore.setState({ location: { status: 'timeout' } })
    renderCard()
    expect(screen.getByText(copy.location.timeoutBody)).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.location.tryAgain })).toBeTruthy()
  })

  it('shows outside-Indonesia warning without nearby counts', () => {
    useMapStore.setState({
      location: { status: 'outside', coords: { lon: 139.7, lat: 35.7 } },
    })
    renderCard()
    expect(screen.getByText(copy.location.outsideTitle)).toBeTruthy()
    expect(screen.getByText(copy.location.outsideBody)).toBeTruthy()
    expect(screen.queryByText(copy.location.nearbyNoHotspots)).toBeNull()
    expect(screen.queryByText(/titik panas dalam 25 km/)).toBeNull()
  })
})
