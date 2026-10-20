/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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
  summary: 'Ringkasan uji. Kalimat kedua.',
  actions: ['Pantau perkembangan satelit.', 'Hubungi Damkar di 113 bila melihat asap.'],
  score: 82,
  quality: 'ok',
  computed_at: '2026-10-09T14:05:00+07:00',
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

  it('shows status hierarchy: badge, count, trend; no air/cuaca in Ringkasan', () => {
    renderDetail(pulangPisau)
    expect(screen.getByText('Sangat tinggi')).toBeTruthy()
    expect(screen.getByText('23', { selector: 'span' })).toBeTruthy()
    expect(screen.getByText(/titik panas · 24 jam/)).toBeTruthy()
    expect(screen.getByText(copy.detail.trendUp)).toBeTruthy()
  })

  it('shows the full seven-day chart immediately without opening a tab or accordion', () => {
    renderDetail(pulangPisau)
    const chart = screen.getByRole('region', { name: copy.extra.trendChart })
    expect(within(chart).getByRole('img', { name: /Tren titik panas/ })).toBeTruthy()
    expect(within(chart).getByText(copy.extra.trendLatest)).toBeTruthy()
    expect(within(chart).getByText(copy.extra.trendPeak)).toBeTruthy()
    expect(within(chart).getByText(copy.extra.trendAverage)).toBeTruthy()
  })

  it('groups long detail content into mobile-friendly tabs', () => {
    renderDetail(pulangPisau)

    expect(screen.getAllByRole('tab')).toHaveLength(4)
    expect(
      screen.getByRole('tab', { name: 'Ringkasan' }).getAttribute('aria-selected'),
    ).toBe('true')

    // Sticky header back button
    expect(screen.getByRole('button', { name: copy.panel.closeDetail })).toBeTruthy()

    expect(screen.getByText('Yang bisa kamu lakukan')).toBeTruthy()
    expect(screen.queryByText('Kondisi saat ini')).toBeNull()
    const telLink = screen.getByRole('link', { name: '113' })
    expect(telLink.getAttribute('href')).toBe('tel:113')

    fireEvent.click(screen.getByRole('tab', { name: 'Lingkungan' }))
    expect(screen.getByText('Kondisi saat ini')).toBeTruthy()
    expect(screen.queryByText('Yang bisa kamu lakukan')).toBeNull()
    expect(screen.queryByText(/Data: NASA FIRMS · Open-Meteo/)).toBeNull()

    // Condition cells
    expect(screen.getByText('Kelembapan')).toBeTruthy()
    expect(screen.getByText('48%')).toBeTruthy()
    expect(screen.getByText('Kecepatan angin')).toBeTruthy()
    expect(screen.getByText('12 km/jam')).toBeTruthy()

    // Disclaimer via ikon info di samping judul
    expect(
      screen.getByRole('button', {
        name: copy.panel.limitationNote,
      }),
    ).toBeTruthy()
  })
})
