import { describe, expect, it } from 'vitest'

import {
  HALO_MIN_TITIK,
  haloDiameter,
  showHalo,
  showHaloPulse,
} from '@/lib/halo'

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

describe('halo visibility', () => {
  it(`floor is ${HALO_MIN_TITIK}`, () => {
    expect(HALO_MIN_TITIK).toBe(5)
  })

  it('Rendah with 8 hotspots → circle, no pulse', () => {
    expect(showHalo(8)).toBe(true)
    expect(showHaloPulse('rendah')).toBe(false)
  })

  it('Sedang with 3 hotspots → no circle', () => {
    expect(showHalo(3)).toBe(false)
  })
})
