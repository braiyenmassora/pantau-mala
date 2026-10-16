/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProvincePin } from '@/components/map/province-pin'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
}))

vi.mock('@/components/ui/map', () => ({
  useMap: () => ({ map: { setMaxBounds: vi.fn(), stop: vi.fn(), fitBounds: vi.fn() } }),
  MapMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  MarkerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('ProvincePin', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useMapStore.setState({ province: 'Semua', selectedCode: null })
    useUiStore.setState({ panelOpen: false })
  })

  it('renders soft halo pulse for high risk without numbers', () => {
    render(
      <ProvincePin
        aggregate={{
          name: 'Kalimantan Selatan',
          center: [115, -3],
          bbox: [114, -4, 116, -2],
          hotspots_24h: 212,
          risk_category: 'sangat_tinggi',
          trend_7d: [0, 0, 0, 0, 0, 0, 212],
        }}
        hovered
      />,
    )

    const pin = screen.getByRole('button', { name: 'Kalimantan Selatan' })
    const halo = screen.getByTestId('province-pin-halo')
    expect(halo.className).toContain('animate-halo-high')
    expect(pin.textContent).not.toContain('212')
    expect(screen.getByText('Kalimantan Selatan')).toBeTruthy()

    fireEvent.click(pin)
    expect(useMapStore.getState().province).toBe('Kalimantan Selatan')
  })

  it('renders mid halo pulse for sedang', () => {
    render(
      <ProvincePin
        aggregate={{
          name: 'Banten',
          center: [106, -6],
          bbox: [105, -7, 107, -5],
          hotspots_24h: 4,
          risk_category: 'sedang',
          trend_7d: [0, 0, 0, 0, 0, 1, 3],
        }}
      />,
    )

    expect(screen.getByTestId('province-pin-halo').className).toContain(
      'animate-halo-mid',
    )
  })
})
