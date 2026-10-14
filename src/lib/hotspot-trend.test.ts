import { describe, expect, it } from 'vitest'

import { hotspotTrend } from '@/lib/hotspot-trend'

describe('hotspotTrend', () => {
  it('detects naik / turun / stabil', () => {
    expect(hotspotTrend([8, 10, 12, 11, 15, 18, 23])).toBe('naik')
    expect(hotspotTrend([20, 18, 16, 12, 10, 8, 5])).toBe('turun')
    expect(hotspotTrend([10, 10, 10, 10, 10, 10, 10])).toBe('stabil')
  })
})
