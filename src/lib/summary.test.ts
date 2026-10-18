import { describe, expect, it } from 'vitest'

import type { Region } from '@/data/types'
import { computeSummary } from '@/lib/summary'

function stub(partial: Partial<Pick<Region, 'risk_category' | 'hotspots_24h'>>): Region {
  return {
    code: 'x',
    name: 'x',
    province: 'x',
    time_zone: 'WIB',
    center: [0, 0],
    weather_danger: { class: 'ekstrem', fwi: 40, source: 'BMKG' },
    hotspots_24h: 1,
    trend_7d: [0, 0, 0, 0, 0, 0, 1],
    weather: {
      temp_c: 30,
      condition: 'Cerah',
      humidity: 50,
      wind_kmh: 5,
      dry_days: 1,
    },
    air_quality: { pm25: 10, category: 'baik' },
    last_detection: {
      time: '2026-10-09T00:00:00+07:00',
      satellite: 'VIIRS',
      confidence: 'tinggi',
      frp_mw: 1,
    },
    summary: '',
    actions: [],
    ...partial,
  }
}

describe('computeSummary', () => {
  it('sums hotspots_24h only (no trend MVP)', () => {
    const summary = computeSummary([
      stub({ risk_category: 'sangat_tinggi', hotspots_24h: 20 }),
      stub({ risk_category: 'sedang', hotspots_24h: 3 }),
    ])
    expect(summary.todayTotal).toBe(23)
    expect(summary.countByCategory).toEqual({
      tidak_tersedia: 0,
      tanpa_titik: 0,
      sangat_tinggi: 1,
      sedang: 1,
      rendah: 0,
    })
  })
})
