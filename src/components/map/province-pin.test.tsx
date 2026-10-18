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

vi.mock('@/data/queries', () => ({
  useMeta: () => ({
    data: {
      updated_at: '2026-10-18T01:00:00.000Z',
      pulled_at: { firms: '2026-10-18T01:00:00.000Z', weather: null },
      status: { firms: 'ok', weather: 'ok', air: 'ok' },
    },
  }),
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

  it('keeps rendah and tanpa titik as small dots without pulse', () => {
    const { rerender } = render(
      <ProvincePin
        aggregate={{
          name: 'DI Yogyakarta',
          center: [110, -8],
          bbox: [109, -9, 111, -7],
          hotspots_24h: 1,
          risk_category: 'rendah',
          trend_7d: [0, 0, 0, 0, 0, 0, 1],
        }}
      />,
    )
    let pin = screen.getByRole('button', { name: 'DI Yogyakarta' })
    expect(pin.className).not.toContain('marker--pulse')
    expect(pin.className).toContain('size-2.5')

    rerender(
      <ProvincePin
        aggregate={{
          name: 'DKI Jakarta',
          center: [107, -6],
          bbox: [106, -7, 108, -5],
          hotspots_24h: 0,
          risk_category: 'rendah',
          trend_7d: [0, 0, 0, 0, 0, 0, 0],
        }}
      />,
    )
    pin = screen.getByRole('button', { name: 'DKI Jakarta' })
    expect(pin.className).not.toContain('marker--pulse')
  })
})
