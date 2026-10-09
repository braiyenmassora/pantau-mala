import { describe, expect, it } from 'vitest'

import { expandBounds10, getMapPadding, INDONESIA_BOUNDS } from './indonesia-view'

describe('indonesia-view', () => {
  it('keeps Indonesia geographic bounds', () => {
    expect(INDONESIA_BOUNDS).toEqual([
      [94.9, -11.2],
      [141.1, 6.3],
    ])
  })

  it('pads for open panel vs closed panel', () => {
    expect(getMapPadding(true)).toEqual({
      left: 432,
      top: 68,
      right: 72,
      bottom: 64,
    })
    expect(getMapPadding(false)).toEqual({
      left: 16,
      top: 68,
      right: 72,
      bottom: 64,
    })
  })

  it('expands bounds 10% on each side', () => {
    const bounds = {
      getWest: () => 100,
      getEast: () => 120,
      getSouth: () => -10,
      getNorth: () => 0,
    }
    expect(expandBounds10(bounds as never)).toEqual([
      [98, -11],
      [122, 1],
    ])
  })
})
