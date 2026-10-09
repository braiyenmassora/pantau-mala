import { describe, expect, it } from 'vitest'

import {
  formatCoordinates,
  formatDateTime,
  formatNumber,
  trendWindowLabels,
} from '@/lib/format'

describe('formatNumber', () => {
  it('uses id-ID decimal comma', () => {
    expect(formatNumber(9.2)).toBe('9,2')
  })
})

describe('formatDateTime', () => {
  it('formats WIT (+9) from UTC ISO', () => {
    // 2026-10-09T05:05:00Z → 14:05 WIT
    expect(formatDateTime('2026-10-09T05:05:00.000Z', 'WIT')).toBe(
      '09 Okt 2026, 14:05 WIT',
    )
  })

  it('formats WIB (+7) from offset ISO', () => {
    expect(formatDateTime('2026-10-09T14:05:00+07:00', 'WIB')).toBe(
      '09 Okt 2026, 14:05 WIB',
    )
  })
})

describe('formatCoordinates', () => {
  it('formats lat, lon with 4 decimals', () => {
    expect(formatCoordinates(114.25, -2.75)).toBe('-2.7500, 114.2500')
  })
})

describe('trendWindowLabels', () => {
  it('returns start 6 days before updated-at', () => {
    expect(trendWindowLabels('2026-10-09T14:05:00+07:00')).toEqual({
      start: '03 Okt',
      end: '09 Okt',
    })
  })
})
