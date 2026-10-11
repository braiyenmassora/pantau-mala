import { describe, expect, it, vi } from 'vitest'

import { fitIndonesia, fitProvinceBounds } from '@/lib/indonesia-view'

function mockMap() {
  const handlers = new Map<string, Set<() => void>>()
  return {
    setMaxBounds: vi.fn(),
    setMinZoom: vi.fn(),
    stop: vi.fn(),
    fitBounds: vi.fn(),
    cameraForBounds: vi.fn(() => ({ zoom: 4.2, center: { lng: 118, lat: -2 } })),
    getZoom: vi.fn(() => 4.2),
    getBounds: () => ({
      getWest: () => 100,
      getSouth: () => -10,
      getEast: () => 140,
      getNorth: () => 5,
    }),
    on(event: string, handler: () => void) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event)!.add(handler)
    },
    off(event: string, handler: () => void) {
      handlers.get(event)?.delete(handler)
    },
    emit(event: string) {
      for (const h of [...(handlers.get(event) ?? [])]) h()
    },
    pending(event: string) {
      return handlers.get(event)?.size ?? 0
    },
  }
}

describe('fitProvinceBounds', () => {
  it('clears maxBounds before fitBounds so navigation is not stuck', () => {
    const map = mockMap()
    fitProvinceBounds(map as never, [110, -4, 116, 0], true, 600)
    expect(map.setMaxBounds).toHaveBeenCalledWith(null)
    expect(map.stop).toHaveBeenCalled()
    expect(map.fitBounds).toHaveBeenCalled()
    expect(map.pending('moveend')).toBe(1)
  })

  it('cancels prior moveend so Semua fit is not clamped by province bounds', () => {
    const map = mockMap()
    fitProvinceBounds(map as never, [110, -4, 116, 0], true, 600)
    expect(map.pending('moveend')).toBe(1)

    fitIndonesia(map as never, true, 600)
    // Handler lama di-off; hanya satu pending dari fitIndonesia.
    expect(map.pending('moveend')).toBe(1)

    map.setMaxBounds.mockClear()
    map.emit('moveend')
    expect(map.setMaxBounds).toHaveBeenCalledTimes(1)
    expect(map.pending('moveend')).toBe(0)
  })
})
