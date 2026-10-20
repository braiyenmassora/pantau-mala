import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapPixelRatio, prefersCompactMap } from '@/lib/map-performance'

describe('mapPixelRatio', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders compact maps at CSS-pixel resolution', () => {
    vi.stubGlobal('window', {
      devicePixelRatio: 3,
      matchMedia: () => ({ matches: true }),
    })
    expect(mapPixelRatio()).toBe(1)
    expect(prefersCompactMap()).toBe(true)
  })

  it('keeps desktop detail but caps excessive density', () => {
    vi.stubGlobal('window', {
      devicePixelRatio: 3,
      matchMedia: () => ({ matches: false }),
    })
    expect(mapPixelRatio()).toBe(2)
  })
})
