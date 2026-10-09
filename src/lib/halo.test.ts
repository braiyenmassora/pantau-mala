import { describe, expect, it } from 'vitest'

import { haloDiameter } from '@/lib/halo'

describe('haloDiameter', () => {
  it.each([
    [0, 40],
    [4, 64],
    [100, 120],
    [300, 120],
  ] as const)('%i hotspots → %i px', (count, expected) => {
    expect(haloDiameter(count)).toBe(expected)
  })

  it('23 hotspots → ≈98 px', () => {
    expect(haloDiameter(23)).toBeCloseTo(98, 0)
  })
})
