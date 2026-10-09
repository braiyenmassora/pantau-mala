import { describe, expect, it } from 'vitest'

import { trendLabel } from '@/lib/trend'

describe('trendLabel', () => {
  it('returns up when day 7 > 115% of day 1', () => {
    expect(trendLabel([8, 10, 9, 14, 15, 19, 23])).toBe('↑ naik')
  })

  it('returns down when day 7 < 85% of day 1', () => {
    expect(trendLabel([10, 9, 8, 7, 6, 5, 4])).toBe('↓ turun')
  })

  it('returns stable between 85%–115%', () => {
    expect(trendLabel([10, 10, 10, 10, 10, 10, 10])).toBe('→ stabil')
    expect(trendLabel([10, 10, 10, 10, 10, 10, 11])).toBe('→ stabil')
  })

  it('returns up from zero when last day > 0', () => {
    expect(trendLabel([0, 0, 0, 0, 0, 0, 2])).toBe('↑ naik')
  })
})
