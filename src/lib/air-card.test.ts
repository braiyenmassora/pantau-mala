import { describe, expect, it } from 'vitest'

import {
  airAdviceFor,
  airCategoryBadgeClass,
  airCategoryLabel,
  airSourceLabel,
  airUpdatedLabel,
  getAirCardMode,
} from '@/lib/air-card'
import { copy } from '@/copy/id'

describe('getAirCardMode', () => {
  it('maps API categories to display modes', () => {
    expect(getAirCardMode('missing')).toBe('missing')
    expect(getAirCardMode('insufficient_data')).toBe('missing')
    expect(getAirCardMode('pending_validation')).toBe('pending')
    expect(getAirCardMode('stale')).toBe('stale')
    expect(getAirCardMode('baik')).toBe('ready')
    expect(getAirCardMode('tidak_sehat')).toBe('ready')
  })
})

describe('airSourceLabel', () => {
  it('prefers API source and falls back to Open-Meteo model', () => {
    expect(airSourceLabel('CAMS')).toBe('CAMS')
    expect(airSourceLabel('  ')).toBe(copy.detail.airSourceFallback)
    expect(airSourceLabel(null)).toBe(copy.detail.airSourceFallback)
  })
})

describe('airAdviceFor', () => {
  it('returns plain wording for baik, never implies safety', () => {
    const text = airAdviceFor('baik')
    expect(text).toContain('diperkirakan baik')
    expect(text?.toLowerCase()).not.toMatch(/\baman\b/)
  })

  it('returns null for non-ready categories', () => {
    expect(airAdviceFor('pending_validation')).toBeNull()
    expect(airAdviceFor('missing')).toBeNull()
  })
})

describe('airCategoryLabel', () => {
  it('hides category for pending and missing', () => {
    expect(airCategoryLabel('pending_validation')).toBeNull()
    expect(airCategoryLabel('missing')).toBeNull()
  })

  it('uses plain Sedang inside the air card', () => {
    expect(airCategoryLabel('sedang')).toBe('Sedang')
    expect(airCategoryLabel('baik')).toBe('Baik')
  })
})

describe('airCategoryBadgeClass', () => {
  it('maps healthy to green, mid to amber, unhealthy+ to red', () => {
    expect(airCategoryBadgeClass('baik')).toContain('risk-low')
    expect(airCategoryBadgeClass('sedang')).toContain('risk-mid')
    expect(airCategoryBadgeClass('tidak_sehat')).toContain('risk-high')
    expect(airCategoryBadgeClass('sangat_tidak_sehat')).toContain('risk-high')
    expect(airCategoryBadgeClass('berbahaya')).toContain('risk-high')
  })

  it('hides badge for non-ready categories', () => {
    expect(airCategoryBadgeClass('missing')).toBeNull()
    expect(airCategoryBadgeClass('stale')).toBeNull()
  })
})

describe('airUpdatedLabel', () => {
  it('formats relative and absolute update time', () => {
    const now = Date.parse('2026-10-18T10:00:00Z')
    const label = airUpdatedLabel(
      { air_updated_at: '2026-10-18T09:30:00Z', time_zone: 'WIB' },
      { window_end: null },
      now,
    )
    expect(label).toMatch(/30 menit lalu/)
    expect(label).toMatch(/WIB/)
  })
})
