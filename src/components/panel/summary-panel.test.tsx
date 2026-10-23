import { useSession } from '@/auth/session'
/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SummaryPanel } from '@/components/panel/summary-panel'
import type { MapRef } from '@/components/ui/map'
import { TooltipProvider } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

vi.mock('@/lib/indonesia-view', () => ({
  fitIndonesia: vi.fn(),
  getMapPadding: () => ({}),
  PLACE_ZOOM: 8,
}))

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}))

const region: Region = {
  code: '62.11',
  name: 'Kab. Pulang Pisau',
  province: 'Kalimantan Tengah',
  time_zone: 'WIB',
  center: [114.25, -2.75],
  weather_danger: { class: 'ekstrem', fwi: 40, source: 'BMKG' },
  risk_category: 'sangat_tinggi',
  hotspots_24h: 0,
  trend_7d: [0, 0, 0, 0, 0, 0, 0],
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
    frp_mw: 0,
  },
  summary: '',
  actions: [],
}

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['meta', '00000000-0000-4000-8000-000000000001', 0], {
    updated_at: new Date().toISOString(),
    status: { firms: 'ok', weather: 'ok', air: 'ok' },
    pulled_at: { firms: null, weather: null },
  })
  client.setQueryData(['region-catalog', '00000000-0000-4000-8000-000000000001', 0], {
    provinces: [],
    regencies: [],
  })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  )
}

describe('SummaryPanel states', () => {
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
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })
    useMapStore.setState({
      province: 'Semua',
      query: '',
      selectedCode: null,
      selectedCategories: new Set(),
      location: { status: 'off' },
    })
  })

  it('shows skeleton while pending, not zero', () => {
    wrap(
      <SummaryPanel
        regions={[]}
        filtered={[]}
        mapRef={createRef<MapRef | null>()}
        isPending
        isError={false}
      />,
    )
    expect(document.querySelector('[aria-busy]')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
  })

  it('shows load fail empty state', () => {
    const onRetry = vi.fn()
    wrap(
      <SummaryPanel
        regions={[]}
        filtered={[]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError
        onRetry={onRetry}
      />,
    )
    expect(screen.getByText(copy.empty.loadFail.title)).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.empty.loadFail.action })).toBeTruthy()
  })

  it('shows no-hotspots empty when totals are zero', () => {
    wrap(
      <SummaryPanel
        regions={[region]}
        filtered={[region]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError={false}
      />,
    )
    expect(screen.getByText(copy.empty.noHotspots.title)).toBeTruthy()
    expect(screen.getByText(copy.empty.noHotspots.description('Indonesia'))).toBeTruthy()
  })

  it('shows satellite note under the main panel title', () => {
    const withHotspots = { ...region, hotspots_24h: 12 }
    wrap(
      <SummaryPanel
        regions={[withHotspots]}
        filtered={[withHotspots]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError={false}
      />,
    )
    expect(screen.getByText(copy.panel.limitationNote)).toBeTruthy()
    expect(copy.panel.limitationNote).toMatch(
      /titik panas satelit.*bukan peringatan resmi kebakaran/i,
    )
    expect(screen.queryByText(copy.panel.coverageNote)).toBeNull()
    expect(screen.getByText(copy.panel.indonesiaToday)).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.panel.titleHint })).toBeTruthy()
  })

  it('shows filter empty with tampilkan semua', () => {
    useMapStore.setState({
      selectedCategories: new Set(['sedang']),
    })
    wrap(
      <SummaryPanel
        regions={[region]}
        filtered={[]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError={false}
      />,
    )
    expect(screen.getByText(copy.empty.noRegionsFilter.title)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.empty.noRegionsFilter.action }),
    ).toBeTruthy()
  })

  it('keeps search input focused when switching to results', async () => {
    const user = userEvent.setup()
    const withHotspots = { ...region, hotspots_24h: 12 }
    wrap(
      <SummaryPanel
        regions={[withHotspots]}
        filtered={[withHotspots]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError={false}
      />,
    )

    const input = screen.getByRole('textbox', {
      name: copy.panel.searchPlaceholder,
    })
    await user.click(input)
    await user.type(input, 'pulang')

    expect(document.activeElement).toBe(input)
    expect((input as HTMLInputElement).value).toBe('pulang')
    expect(screen.getByText(copy.panel.searchResults)).toBeTruthy()
  })

  it('shows search UI when filter empty but query active', () => {
    useMapStore.setState({
      selectedCategories: new Set(['sedang']),
      query: 'xyz',
    })
    wrap(
      <SummaryPanel
        regions={[region]}
        filtered={[]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError={false}
      />,
    )
    expect(screen.getByText(copy.panel.searchResults)).toBeTruthy()
    expect(
      screen.getByRole('textbox', { name: copy.panel.searchPlaceholder }),
    ).toBeTruthy()
    expect(screen.queryByText(copy.empty.noRegionsFilter.title)).toBeNull()
  })
})
