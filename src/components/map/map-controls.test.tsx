/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { createRef, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MapControls } from '@/components/map/map-controls'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}))

const useMeta = vi.fn()

vi.mock('@/data/queries', () => ({
  useRegions: () => ({ data: [] }),
  useHotspots: () => ({ data: null }),
  useMeta: () => useMeta(),
}))

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('MapControls', () => {
  afterEach(() => {
    cleanup()
    useMeta.mockReset()
  })

  it('shows location control, relative update stamp, and basemap attribution', () => {
    useMeta.mockReturnValue({
      data: {
        updated_at: new Date(Date.now() - 28 * 60_000).toISOString(),
        status: { firms: 'ok', weather: 'ok', air: 'ok' },
        pulled_at: { firms: null, weather: null },
      },
    })
    wrap(<MapControls mapRef={createRef<MapRef | null>()} />)

    expect(screen.getByRole('button', { name: copy.map.useMyLocation })).toBeTruthy()
    expect(screen.queryByRole('button', { name: copy.map.zoomIn })).toBeNull()
    expect(screen.queryByRole('button', { name: copy.map.zoomOut })).toBeNull()
    expect(screen.getByTestId('map-updated-stamp').textContent).toMatch(
      /^Diperbarui .+ menit lalu$/,
    )
    const attrib = screen.getByTestId('map-basemap-attribution')
    expect(attrib.textContent).toMatch(/© CARTO/)
    expect(attrib.textContent).toMatch(/© OpenStreetMap/)
  })

  it('shows a visible stale stamp when meta is old', () => {
    useMeta.mockReturnValue({
      data: {
        updated_at: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
        status: { firms: 'ok', weather: 'ok', air: 'ok' },
        pulled_at: { firms: null, weather: null },
      },
    })
    wrap(<MapControls mapRef={createRef<MapRef | null>()} />)
    const stamp = screen.getByTestId('map-updated-stamp')
    expect(stamp.getAttribute('role')).toBe('alert')
    expect(stamp.textContent).toMatch(/^Data mungkin usang · /)
  })
})
