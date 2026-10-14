/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProvincePin } from '@/components/map/province-pin'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

vi.mock('@/components/ui/map', () => ({
  useMap: () => ({ map: { setMaxBounds: vi.fn(), stop: vi.fn(), fitBounds: vi.fn() } }),
  MapMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  MarkerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
}))

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('ProvincePin', () => {
  afterEach(cleanup)

  beforeEach(() => {
    // @ts-expect-error test stub
    global.ResizeObserver = ResizeObserverStub
    useMapStore.setState({ province: 'Semua', selectedCode: null })
    useUiStore.setState({ panelOpen: false })
  })

  it('shows RiskMarker without count badge; tooltip is province name only', async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider>
        <ProvincePin
          aggregate={{
            name: 'Kalimantan Selatan',
            center: [115, -3],
            bbox: [114, -4, 116, -2],
            hotspots_24h: 212,
            risk_category: 'sangat_tinggi',
          }}
        />
      </TooltipProvider>,
    )
    const pin = screen.getByRole('button', {
      name: /Kalimantan Selatan.*212 titik panas/,
    })
    expect(pin.querySelector('svg')).toBeNull()
    expect(pin.querySelector('.bg-risk-high')?.classList.contains('rounded-full')).toBe(
      true,
    )
    expect(pin.querySelector('span[aria-hidden].tabular-nums')).toBeNull()
    expect(pin.textContent).not.toContain('212')
    expect(screen.queryByText('Kalimantan Selatan')).toBeNull()
    await user.hover(pin)
    const tip = await screen.findByRole('tooltip')
    expect(tip.textContent).toBe('Provinsi Kalimantan Selatan')
    expect(tip.textContent).not.toContain('titik panas')
    await user.click(pin)
    expect(useMapStore.getState().province).toBe('Kalimantan Selatan')
  })
})
