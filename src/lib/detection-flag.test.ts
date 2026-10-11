import { describe, expect, it } from 'vitest'

import { buildDetectionFlag, formatDetectionDate } from '@/lib/detection-flag'

describe('formatDetectionDate', () => {
  it('formats full Indonesian month with seconds in zone', () => {
    expect(formatDetectionDate('2026-10-09T20:52:00.000Z', 'WIT')).toBe(
      '10 Oktober 2026 05:52:00',
    )
  })
})

describe('buildDetectionFlag', () => {
  it('is name and province only', () => {
    expect(
      buildDetectionFlag({ name: 'Kab. Merauke', province: 'Papua Selatan' }),
    ).toEqual({
      title: 'Kab. Merauke',
      subtitle: 'Provinsi Papua Selatan',
    })
  })
})
