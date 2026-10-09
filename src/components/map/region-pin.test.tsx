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

function renderPin() {
  return render(
    <TooltipProvider>
      <RegionPin region={region} />
    </TooltipProvider>,
  )
}

describe('RegionPin', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    useMapStore.setState({ selectedCode: null, hoveredCode: null })
  })

  it('keeps aria-label with nama, skor, and risiko', () => {
    renderPin()
    expect(
      screen.getByRole('button', {
        name: 'Kab. Pulang Pisau, skor 82, risiko Sangat tinggi',
      }),
    ).toBeTruthy()
  })

  it('does not show wilayah name on the active (selected) pin', () => {
    useMapStore.setState({ selectedCode: region.kode })
    renderPin()
    const pin = screen.getByRole('button', {
      name: 'Kab. Pulang Pisau, skor 82, risiko Sangat tinggi',
    })
    expect(pin.textContent).toBe('82')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows wilayah name in tooltip on keyboard focus', async () => {
    const user = userEvent.setup()
    renderPin()
    await user.tab()
    const tip = await screen.findByRole('tooltip')
    expect(tip.textContent).toContain('Kab. Pulang Pisau')
  })
})
