import { describe, expect, it } from 'vitest'

import { pinTipMapOffsetY } from '@/components/map/map-pin-tip'

describe('pinTipMapOffsetY', () => {
  it('pushes pin down when canvas is shorter than tip + pad', () => {
    // Mobile half: ~422px map above sheet — tip would clip without offset.
    expect(pinTipMapOffsetY(422, 300, 72)).toBe(161)
  })

  it('returns 0 when there is already room above center', () => {
    expect(pinTipMapOffsetY(900, 300, 72)).toBe(0)
  })
})
