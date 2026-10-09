import { describe, expect, it } from 'vitest'

import { getMapPadding, INDONESIA_BOUNDS, MAP_MAX_BOUNDS } from './indonesia-view'

describe('indonesia-view', () => {
  it('uses the specified Indonesia and max bounds', () => {
    expect(INDONESIA_BOUNDS).toEqual([
      [94.9, -11.2],
      [141.1, 6.3],
    ])
    expect(MAP_MAX_BOUNDS).toEqual([
      [50, -40],
      [155, 35],
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
})
