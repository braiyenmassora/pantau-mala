import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fitIndonesia,
  fitProvinceBounds,
  getMapPadding,
  shouldRefitIndonesiaOnZoomOut,
} from '@/lib/indonesia-view'
import { LAYOUT } from '@/lib/layout'

function stubWidth(width: number, height = 800) {
  vi.stubGlobal('window', { innerWidth: width, innerHeight: height })
}

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
    expect(map.jumpTo).toHaveBeenCalledWith(expect.objectContaining({ zoom: 4.2 }))
    // Zoom-out berhenti di overview nasional (seluruh RI muat), bukan lebih jauh ke laut.
    expect(map.setMinZoom).toHaveBeenCalledWith(4.2)
  })

  it('allows zoom-out down to a low natural fit without raising the floor', () => {
    const map = mockMap()
    map.cameraForBounds = vi.fn(() => ({ zoom: 3.1, center: { lng: 118, lat: -2 } }))
    const zoom = fitIndonesia(map as never, true, 0)
    expect(zoom).toBe(3.1)
    expect(map.setMinZoom).toHaveBeenCalledWith(3.1)
  })

  it('handles coordinate array center from cameraForBounds correctly', () => {
    const map = mockMap()
    map.cameraForBounds = vi.fn(() => ({ zoom: 4.5, center: [115, -1] as never }))
    const zoom = fitIndonesia(map as never, false, 0)
    expect(zoom).toBe(4.5)
    expect(map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [115, -1], zoom: 4.5 }),
    )
  })
})

describe('shouldRefitIndonesiaOnZoomOut', () => {
  it('asks for national refit when zoomed out but bounds miss Sabang–Merauke', () => {
    const map = {
      getZoom: () => 4.0,
      getBounds: () => ({
        getWest: () => 108,
        getSouth: () => -6,
        getEast: () => 120,
        getNorth: () => 2,
      }),
    }
    expect(shouldRefitIndonesiaOnZoomOut(map as never, 4.2)).toBe(true)
  })

  it('skips refit when bounds already cover Indonesia', () => {
    const map = {
      getZoom: () => 4.0,
      getBounds: () => ({
        getWest: () => 94,
        getSouth: () => -12,
        getEast: () => 142,
        getNorth: () => 7,
      }),
    }
    expect(shouldRefitIndonesiaOnZoomOut(map as never, 4.2)).toBe(false)
  })
})

describe('getMapPadding', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses compact bottom pad on mobile (sheet sits outside map canvas)', () => {
    stubWidth(390, 800)
    const open = getMapPadding(true)
    expect(open.left).toBe(LAYOUT.gutter)
    expect(open.bottom).toBe(LAYOUT.gutter + LAYOUT.controlSize)
    expect(getMapPadding(false).bottom).toBe(LAYOUT.gutter + LAYOUT.controlSize)
  })

  it('uses full overlay inset on desktop when panel open', () => {
    stubWidth(1280)
    expect(getMapPadding(true).left).toBe(LAYOUT.overlayInset)
  })

  it('keeps tablet map width at least mapMinWidth', () => {
    stubWidth(700)
    const pad = getMapPadding(true)
    expect(700 - (pad.left as number)).toBeGreaterThanOrEqual(LAYOUT.mapMinWidth)
  })
})
