import { describe, expect, it } from 'vitest'

import { formatDateTime, formatNumber, formatRelativeAge } from '@/lib/format'

describe('formatNumber', () => {
  it('uses id-ID decimal comma', () => {
    expect(formatNumber(9.2)).toBe('9,2')
  })
})

describe('formatDateTime', () => {
  it('formats WIT (+9) from UTC ISO', () => {
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

describe('formatRelativeAge', () => {
  it('uses lowercase menit lalu', () => {
    const now = Date.parse('2026-10-11T12:46:00Z')
    expect(formatRelativeAge('2026-10-11T12:00:00Z', now)).toBe('46 menit lalu')
  })
})
