/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProvincePin } from '@/components/map/province-pin'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

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

  it('renders pulsing red pin without numbers; hover shows name only', () => {
    const onHover = vi.fn()
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
        onHover={onHover}
      />,
    )

    const pin = screen.getByRole('button', { name: 'Kalimantan Selatan' })
    expect(pin.className).toContain('marker--pulse')
    expect(pin.style.getPropertyValue('--beat')).toBe('0.75s')
    expect(pin.textContent).not.toContain('212')
    expect(screen.getByText('Kalimantan Selatan')).toBeTruthy()

    fireEvent.click(pin)
    expect(useMapStore.getState().province).toBe('Kalimantan Selatan')
  })

  it('renders slow yellow pulse for sedang', () => {
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

    const pin = screen.getByRole('button', { name: 'Banten' })
    expect(pin.className).toContain('marker--pulse')
    expect(pin.style.getPropertyValue('--beat')).toBe('1.8s')
  })
})
