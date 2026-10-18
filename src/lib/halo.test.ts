import { describe, expect, it } from 'vitest'

import { HALO_MIN_TITIK, haloDiameter, shouldShowHalo, showHaloPulse } from '@/lib/halo'

describe('haloDiameter', () => {
  it.each([
    [0, 28],
    [4, 38],
    [100, 52],
    [300, 52],
  ] as const)('%i hotspots → %i px', (count, expected) => {
    expect(haloDiameter(count)).toBe(expected)
  })

  it('23 hotspots → ≈52 px (capped)', () => {
    expect(haloDiameter(23)).toBeCloseTo(52, 0)
  })
})

describe('halo visibility', () => {
  it(`floor is ${HALO_MIN_TITIK}`, () => {
    expect(HALO_MIN_TITIK).toBe(5)
  })

  it('Rendah with 8 hotspots → circle + pulse', () => {
    expect(shouldShowHalo(8)).toBe(true)
    expect(showHaloPulse('rendah')).toBe(true)
  })

  it('all risk pins pulse, including without circle floor', () => {
    expect(shouldShowHalo(3)).toBe(false)
    expect(showHaloPulse('sedang')).toBe(true)
    expect(showHaloPulse('sangat_tinggi')).toBe(true)
    expect(showHaloPulse('tanpa_titik')).toBe(true)
  })
})
