import { describe, expect, it, vi } from 'vitest'

import { fitIndonesia, fitProvinceBounds } from '@/lib/indonesia-view'

function mockMap() {
  const handlers = new Map<string, Set<() => void>>()
  return {
    setMaxBounds: vi.fn(),
    setMinZoom: vi.fn(),
    stop: vi.fn(),
    fitBounds: vi.fn(),
    jumpTo: vi.fn(),
    easeTo: vi.fn(),
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
    // Jangan schedule maxBounds ke viewport provinsi (blokir zoom-out).
    expect(map.pending('moveend')).toBe(0)
  })

  it('cancels prior national moveend so province fit is not clamped later', () => {
    const map = mockMap()
    fitIndonesia(map as never, true, 600)
    expect(map.easeTo).toHaveBeenCalled()
    expect(map.pending('moveend')).toBe(1)

    fitProvinceBounds(map as never, [110, -4, 116, 0], true, 600)
    // Handler fitIndonesia di-off; province fit tidak menambah pending.
    expect(map.pending('moveend')).toBe(0)

    map.setMaxBounds.mockClear()
    map.emit('moveend')
    expect(map.setMaxBounds).not.toHaveBeenCalled()
  })

  it('uses natural fit zoom so Sabang–Merauke (Papua) stays in view', () => {
    const map = mockMap()
    const zoom = fitIndonesia(map as never, false, 0)
    // mock cameraForBounds zoom 4.2 — jangan diangkat ke floor tinggi yang memotong Papua
    expect(zoom).toBe(4.2)
    expect(map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 4.2 }),
    )
  })
})
