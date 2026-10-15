/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegionPin } from '@/components/map/region-pin'
import { TooltipProvider } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

vi.mock('@/components/ui/map', () => ({
  MapMarker: ({
    children,
    onMouseEnter,
    onMouseLeave,
  }: {
    children: React.ReactNode
    onMouseEnter?: () => void
    onMouseLeave?: () => void
  }) => (
    <div data-testid="map-marker" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {children}
    </div>
  ),
  MarkerContent: ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => <div className={className}>{children}</div>,
  useMap: () => ({
    map: { flyTo: vi.fn(), setMaxBounds: vi.fn(), stop: vi.fn() },
  }),
}))

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}))

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const region: Region = {
  code: '62.11',
  name: 'Kab. Pulang Pisau',
  province: 'Kalimantan Tengah',
  time_zone: 'WIB',
  center: [114.25, -2.75],
  weather_danger: { class: 'ekstrem', fwi: 42.5, source: 'BMKG' },
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

function renderPin(overrides: Partial<Region> = {}) {
  return render(
    <TooltipProvider>
      <RegionPin region={{ ...region, ...overrides }} />
    </TooltipProvider>,
  )
}

function pinButton(name = 'Kab. Pulang Pisau, risiko Sangat tinggi, 23 titik panas') {
  return screen.getByRole('button', { name })
}

describe('RegionPin', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    // @ts-expect-error test stub
    global.ResizeObserver = ResizeObserverStub
    useMapStore.setState({ selectedCode: null, hoveredCode: null })
    useUiStore.setState({ panelOpen: false })
  })

  it('selects region and opens panel on click', async () => {
    const user = userEvent.setup()
    renderPin()
    await user.click(pinButton())
    expect(useMapStore.getState().selectedCode).toBe('62.11')
    expect(useUiStore.getState().panelOpen).toBe(true)
  })

  it('keeps aria-label with nama, risiko, and hotspot count', () => {
    renderPin()
    expect(pinButton()).toBeTruthy()
  })

  it('sangat_tinggi pin is a single red circle', () => {
    renderPin()
    const pin = pinButton()
    expect(pin.querySelector('svg')).toBeNull()
    const dot = pin.querySelector('.bg-risk-high')
    expect(dot?.classList.contains('rounded-full')).toBe(true)
    expect(dot?.querySelector('.rounded-full')).toBeNull()
    expect(pin.textContent).toBe('')
  })

  it('sedang pin is a single orange circle', () => {
    renderPin({
      code: '62.12',
      name: 'Kab. Sedang',
      weather_danger: { class: 'waspada', fwi: 12, source: 'BMKG' },
      risk_category: 'sedang',
      hotspots_24h: 4,
    })
    const pin = pinButton('Kab. Sedang, risiko Sedang, 4 titik panas')
    expect(pin.querySelector('svg')).toBeNull()
    expect(pin.querySelector('.bg-risk-mid')?.classList.contains('rounded-full')).toBe(
      true,
    )
  })

  it('rendah map pin is a 10px risk-low dot (not RiskMarker circle)', () => {
    renderPin({
      code: '62.13',
      name: 'Kab. Rendah',
      weather_danger: { class: 'aman', fwi: 2, source: 'BMKG' },
      risk_category: 'rendah',
      hotspots_24h: 0,
    })
    const pin = pinButton('Kab. Rendah, risiko Rendah, 0 titik panas')
    expect(pin.querySelector('svg')).toBeNull()
    expect(pin.classList.contains('size-2.5')).toBe(true)
    expect(pin.classList.contains('bg-risk-low')).toBe(true)
  })

  it('tooltip shows nama only; hidden when selected', async () => {
    const user = userEvent.setup()
    renderPin()
    const pin = pinButton()
    await user.hover(pin)
    const tip = await screen.findByRole('tooltip')
    expect(tip.textContent).toBe('Kab. Pulang Pisau')
    expect(tip.textContent).not.toContain('titik panas')

    await user.click(pin)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('rendah pin hover shows nama only', async () => {
    const user = userEvent.setup()
    renderPin({
      code: '62.13',
      name: 'Kab. Rendah',
      weather_danger: { class: 'aman', fwi: 2, source: 'BMKG' },
      risk_category: 'rendah',
      hotspots_24h: 0,
    })
    await user.hover(pinButton('Kab. Rendah, risiko Rendah, 0 titik panas'))
    const tip = await screen.findByRole('tooltip')
    expect(tip.textContent).toBe('Kab. Rendah')
  })

  it('shows detection flag with hotspots after click', async () => {
    const user = userEvent.setup()
    renderPin()
    expect(screen.queryByText('NASA-MODIS')).toBeNull()
    await user.click(pinButton())
    expect(
      screen.getByText(copy.map.regionMetaProvince('Kalimantan Tengah')),
    ).toBeTruthy()
    expect(screen.queryByText('NASA-MODIS')).toBeNull()
    expect(screen.queryByLabelText(new RegExp(copy.detail.airQuality))).toBeNull()
  })
})
