import { describe, expect, it } from 'vitest'

import { getDataFreshness } from '@/lib/data-freshness'
import type { Meta } from '@/data/types'
import { META_STALE_MS } from '@/lib/format'

function meta(partial: Partial<Meta> & Pick<Meta, 'updated_at' | 'status'>): Meta {
  return {
    pulled_at: { firms: null, weather: null },
    ...partial,
  }
}

describe('getDataFreshness', () => {
  const now = Date.parse('2026-10-18T10:00:00Z')

  it('is quiet when FIRMS is fresh and ok', () => {
    const result = getDataFreshness(
      meta({
        updated_at: new Date(now - 30 * 60_000).toISOString(),
        status: { firms: 'ok', weather: 'ok', air: 'ok' },
      }),
      now,
    )
    expect(result.warn).toBe(false)
    expect(result.stale).toBe(false)
    expect(result.problemSources).toEqual([])
  })

  it('warns when timestamp is beyond ingest cadence', () => {
    const result = getDataFreshness(
      meta({
        updated_at: new Date(now - META_STALE_MS - 60_000).toISOString(),
        status: { firms: 'ok', weather: 'ok', air: 'ok' },
      }),
      now,
    )
    expect(result.warn).toBe(true)
    expect(result.stale).toBe(true)
  })

  it('warns when a source is late or failed', () => {
    const result = getDataFreshness(
      meta({
        updated_at: new Date(now - 10 * 60_000).toISOString(),
        status: { firms: 'gagal', weather: 'ok', air: 'terlambat' },
      }),
      now,
    )
    expect(result.warn).toBe(true)
    expect(result.problemSources).toEqual(['firms', 'air'])
  })

  it('warns when update time is missing', () => {
    const result = getDataFreshness(
      meta({
        updated_at: null,
        status: { firms: 'ok', weather: 'ok', air: 'ok' },
      }),
      now,
    )
    expect(result.warn).toBe(true)
  })
})
