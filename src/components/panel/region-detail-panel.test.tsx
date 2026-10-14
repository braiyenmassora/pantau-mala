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

  it('shows status hierarchy: badge, count, trend; no air/cuaca tiles', () => {
    renderDetail(pulangPisau)
    expect(screen.getByText('Sangat tinggi')).toBeTruthy()
    expect(screen.getByText('23')).toBeTruthy()
    expect(screen.getByText(copy.detail.hotspot24hLabel)).toBeTruthy()
    expect(screen.getByText(copy.detail.trendUp)).toBeTruthy()
    expect(screen.queryByText(copy.detail.airQuality)).toBeNull()
    expect(screen.queryByText(copy.source.cuaca)).toBeNull()
    expect(screen.queryByText(/Deteksi 9 Oktober/)).toBeNull()
  })

  it('shows calibration note, update stamp, conditions and accordions', () => {
    renderDetail(pulangPisau)
    expect(
      screen.getByText(copy.detail.calibrationNote('82', 'ok')),
    ).toBeTruthy()
    expect(screen.getByText(/Diperbarui /)).toBeTruthy()
    expect(screen.getByText(copy.detail.humidity)).toBeTruthy()
    expect(screen.getByText(copy.detail.weatherDanger)).toBeTruthy()
    expect(screen.getByText(copy.bahaya.ekstrem)).toBeTruthy()
    expect(screen.getByText(copy.extra.detection)).toBeTruthy()
    expect(screen.getByText(copy.extra.river)).toBeTruthy()
    expect(screen.getByText(copy.extra.sourcesUpdates)).toBeTruthy()
    expect(screen.queryByText(copy.extra.loadRiver)).toBeNull()
  })
})
