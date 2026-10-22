/** @vitest-environment jsdom */
import { useSession } from '@/auth/session'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}))

import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useLocaleStore } from '@/copy'
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
  air_quality: {
    pm25: 62,
    category: 'tidak_sehat',
    source: 'CAMS',
  },
  last_detection: {
    time: '2026-10-09T13:55:00+07:00',
    satellite: 'MODIS Aqua',
    confidence: 'tinggi',
    frp_mw: 11.4,
    village: 'Buntoi',
    district: 'Kahayan Hilir',
  },
  summary: 'Ringkasan uji. Kalimat kedua.',
  actions: ['Pantau perkembangan satelit.', copy.detail.actionFireContact],
  score: 82,
  quality: 'ok',
  computed_at: '2026-10-09T14:05:00+07:00',
  air_updated_at: '2026-10-09T14:00:00+07:00',
}

function renderDetail(region: Region) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['meta', '00000000-0000-4000-8000-000000000001', 0], {
    updated_at: new Date().toISOString(),
    status: { firms: 'ok', weather: 'ok', air: 'ok' },
    pulled_at: { firms: null, weather: null },
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
  })

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
    expect(document.querySelector('.text-3xl.font-mono')?.textContent).toBe('23')
    expect(screen.getByText(copy.detail.hotspotUnitLine)).toBeTruthy()
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === 'SPAN' &&
          el.textContent === `${copy.detail.trendUp} ${copy.detail.trendVsPrevious}`,
      ),
    ).toBeTruthy()
  })

  it('shows the full seven-day chart immediately without opening a tab or accordion', () => {
    renderDetail(pulangPisau)
    const chart = screen.getByRole('region', { name: copy.extra.trendChart })
    expect(within(chart).getByRole('img', { name: /Tren 7 hari/ })).toBeTruthy()
    expect(within(chart).getByText(copy.extra.trendLatest)).toBeTruthy()
    expect(within(chart).getByText(copy.extra.trendPeak)).toBeTruthy()
    expect(within(chart).getByText(copy.extra.trendAverage)).toBeTruthy()
  })

  it('translates known backend saran actions when locale is English', () => {
    useLocaleStore.getState().setLocale('en')
    try {
      renderDetail({
        ...pulangPisau,
        actions: [
          'Jangan membakar lahan, sampah, atau membuang puntung rokok sembarangan.',
          'Kurangi aktivitas di luar bila ada asap dan ikuti informasi kualitas udara resmi.',
        ],
      })
      expect(
        screen.getByText(/Do not burn land or trash, and do not carelessly throw away/),
      ).toBeTruthy()
      expect(
        screen.getByText(/Reduce outdoor activities when there is smoke/),
      ).toBeTruthy()
    } finally {
      useLocaleStore.getState().setLocale('id')
    }
  })

  it('renders all sections in a single scroll without tabs', () => {
    renderDetail(pulangPisau)

    // No tabs
    expect(screen.queryByRole('tab')).toBeNull()

    // Sticky header back button
    expect(screen.getByRole('button', { name: copy.panel.closeDetail })).toBeTruthy()

    // Sections without Ringkasan or duplicate attribution
    expect(screen.queryByText('Ringkasan')).toBeNull()
    expect(screen.getByText('Kondisi saat ini')).toBeTruthy()
    expect(screen.getByText(copy.detail.actions)).toBeTruthy()
    expect(screen.queryByText(/Data: NASA FIRMS · Open-Meteo/)).toBeNull()

    // Condition cells
    expect(screen.getByText(copy.detail.humidity)).toBeTruthy()
    expect(screen.getByText('48%')).toBeTruthy()
    expect(screen.getByText(copy.detail.wind)).toBeTruthy()
    expect(screen.getByText(`12 ${copy.detail.windUnit}`)).toBeTruthy()

    // Jalur darurat 112
    const telLink = screen.getByRole('link', { name: '112' })
    expect(telLink).toBeTruthy()
    expect(telLink.getAttribute('href')).toBe('tel:112')

    // Satu ⓘ risiko di judul (bukan di tiap angka)
    expect(
      screen.getByRole('button', {
        name: copy.detail.riskTooltip,
      }),
    ).toBeTruthy()
  })

  it('omits last satellite detection and air advice copy', () => {
    renderDetail(pulangPisau)
    expect(screen.queryByText(copy.detail.lastDetection)).toBeNull()
    expect(screen.queryByText(/MODIS Aqua/)).toBeNull()
    expect(screen.queryByText(copy.detail.airAdvice.tidak_sehat)).toBeNull()
  })

  it('keeps air quality in the conditions card with matching metric scale', () => {
    renderDetail(pulangPisau)
    expect(screen.getByLabelText(copy.detail.conditions)).toBeTruthy()
    expect(screen.getByText('Tidak sehat')).toBeTruthy()
    expect(screen.getByText(copy.detail.airPm25)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.detail.weatherSourceNote }),
    ).toBeTruthy()
    // Hanya angka titik panas yang display 3xl — PM2.5 ikut skala metrik biasa.
    expect(document.querySelectorAll('.text-3xl.font-mono')).toHaveLength(1)
    expect(screen.queryByLabelText(copy.detail.airQuality)).toBeNull()
  })

  it('shows full official refs with differ note and empty Posko', () => {
    renderDetail(pulangPisau)
    expect(screen.getByTestId('official-refs-card')).toBeTruthy()
    expect(screen.getByText(copy.official.differNote)).toBeTruthy()
    expect(screen.queryByText(copy.official.poskoTitle)).toBeNull()
    expect(screen.getByText(copy.official.poskoEmptyName)).toBeTruthy()
    expect(screen.getByText(copy.official.poskoEmpty)).toBeTruthy()
  })

  it('does not show a share button on region detail', () => {
    renderDetail(pulangPisau)
    expect(screen.queryByRole('button', { name: copy.share.button })).toBeNull()
  })
})
