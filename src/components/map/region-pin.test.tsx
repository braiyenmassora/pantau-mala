/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegionPin } from '@/components/map/region-pin'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

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
  useMap: () => ({ map: { flyTo: vi.fn() } }),
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
  kode: '62.11',
  nama: 'Kab. Pulang Pisau',
  provinsi: 'Kalimantan Tengah',
  zona_waktu: 'WIB',
  pusat: [114.25, -2.75],
  skor: 82,
  kategori: 'sangat_tinggi',
  titik_panas_24j: 23,
  tren_7h: [8, 10, 9, 14, 15, 19, 23],
  cuaca: {
    suhu_c: 34,
    kondisi: 'Cerah',
    kelembapan: 48,
    angin_kmj: 12,
    hari_tanpa_hujan: 9,
  },
  udara: { pm25: 62, kategori: 'tidak_sehat' },
  deteksi_terakhir: {
    waktu: '2026-10-09T13:55:00+07:00',
    satelit: 'MODIS Aqua',
    keyakinan: 'tinggi',
    frp_mw: 11.4,
  },
  ringkasan: '',
  saran: [],
}

function renderPin(overrides: Partial<Region> = {}) {
  return render(
    <TooltipProvider>
      <RegionPin region={{ ...region, ...overrides }} />
    </TooltipProvider>,
  )
}

function pinButton(name = 'Kab. Pulang Pisau, risiko Sangat tinggi, skor 82') {
  return screen.getByRole('button', { name })
}

describe('RegionPin', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    useMapStore.setState({ selectedCode: null, hoveredCode: null })
  })

  it('keeps aria-label with nama, risiko, and skor', () => {
    renderPin()
    expect(pinButton()).toBeTruthy()
  })

  it('sangat_tinggi pin shows Flame with risk-high colors, no skor digit', () => {
    renderPin()
    const pin = pinButton()
    const icon = pin.querySelector('svg')
    expect(icon).toBeTruthy()
    expect(icon?.classList.contains('fill-risk-high')).toBe(true)
    expect(icon?.classList.contains('stroke-risk-high')).toBe(true)
    expect(pin.textContent).toBe('')
  })

  it('sedang pin shows Flame with risk-mid colors', () => {
    renderPin({
      kode: '62.12',
      nama: 'Kab. Sedang',
      skor: 55,
      kategori: 'sedang',
      titik_panas_24j: 4,
    })
    const pin = pinButton('Kab. Sedang, risiko Sedang, skor 55')
    const icon = pin.querySelector('svg')
    expect(icon?.classList.contains('fill-risk-mid')).toBe(true)
    expect(icon?.classList.contains('stroke-risk-mid')).toBe(true)
  })

  it('rendah pin shows a risk-low dot without Flame', () => {
    renderPin({
      kode: '62.13',
      nama: 'Kab. Rendah',
      skor: 12,
      kategori: 'rendah',
      titik_panas_24j: 0,
    })
    const pin = pinButton('Kab. Rendah, risiko Rendah, skor 12')
    expect(pin.querySelector('svg')).toBeNull()
    const dot = pin.querySelector('.bg-risk-low')
    expect(dot).toBeTruthy()
    expect(dot?.classList.contains('size-2')).toBe(true)
  })

  it('tooltip shows nama and skor on hover; hidden when selected', async () => {
    const user = userEvent.setup()
    renderPin()
    const pin = pinButton()
    await user.hover(pin)
    const tip = await screen.findByRole('tooltip')
    expect(tip.textContent).toContain('Kab. Pulang Pisau')
    expect(tip.textContent).toContain('Skor')
    expect(tip.textContent).toContain('82')
    expect(tip.querySelector('.font-mono')?.textContent).toBe('82')

    await user.click(pin)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
