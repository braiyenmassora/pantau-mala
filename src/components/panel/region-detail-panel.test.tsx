/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}))

import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { TooltipProvider } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'

const pulangPisau: Region = {
  code: '62.11',
  name: 'Kab. Pulang Pisau',
  province: 'Kalimantan Tengah',
  time_zone: 'WIB',
  center: [114.25, -2.75],
  weather_danger: { class: 'ekstrem', fwi: 40, source: 'BMKG' },
  risk_category: 'sangat_tinggi',
  hotspots_24h: 23,
  trend_7d: [8, 10, 12, 11, 15, 18, 23],
  weather: {
    temp_c: 34,
    condition: 'Cerah berawan',
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
    village: 'Buntoi',
    district: 'Kahayan Hilir',
  },
  summary: 'Ringkasan uji',
  actions: ['Saran uji'],
}

function renderDetail(region: Region) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <RegionDetailPanel region={region} />
      </TooltipProvider>
    </QueryClientProvider>,
  )
}

describe('RegionDetailPanel', () => {
  afterEach(cleanup)

  it('moves focus to the region title on open', () => {
    renderDetail(pulangPisau)
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: pulangPisau.name }),
    )
  })

  it('shows province without coordinates in the header', () => {
    renderDetail(pulangPisau)
    expect(
      screen.getByText(copy.map.regionMetaProvince(pulangPisau.province)),
    ).toBeTruthy()
    expect(screen.queryByText(/114\.|-2\./)).toBeNull()
  })

  it('shows detection time in header; air quality only in conditions', () => {
    renderDetail(pulangPisau)
    expect(screen.getByText(/Deteksi 9 Oktober 2026/)).toBeTruthy()
    expect(screen.queryByText('Info teknis satelit')).toBeNull()
    expect(screen.getByText(copy.detail.airQuality)).toBeTruthy()
    expect(screen.getByText(copy.air.tidak_sehat)).toBeTruthy()
  })

  it('shows backend indicator score provisionally and separates weather metrics', () => {
    renderDetail(pulangPisau)
    expect(screen.getByText(copy.detail.riskTitle)).toBeTruthy()
    expect(screen.getByText('Sangat tinggi')).toBeTruthy()
    expect(screen.getByText(copy.detail.hotspots24hReason('23'))).toBeTruthy()
    expect(screen.getByText(copy.detail.weatherDanger)).toBeTruthy()
    expect(screen.getByText(copy.bahaya.ekstrem)).toBeTruthy()
    expect(screen.queryByText('/100')).toBeNull()
    expect(screen.getByText(copy.extra.score)).toBeTruthy()
    expect(screen.getByText(copy.extra.provisional)).toBeTruthy()
    expect(screen.queryByText(copy.panel.hotspot24h)).toBeNull()
  })
})
