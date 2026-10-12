import { describe, expect, it } from 'vitest'

import { copy } from '@/copy/id'
import { compareRegionsByRisk } from '@/lib/risk-rule'

describe('copy honesty', () => {
  const blob = JSON.stringify(copy)

  it('labels backend scores as provisional rather than official warnings', () => {
    expect(copy.extra.score).toBe('Skor')
    expect(copy.extra.provisional).toMatch(/kalibrasi/i)
  })

  it('does not claim active fire or official emergency', () => {
    expect(blob).not.toMatch(
      /kebakaran aktif|sedang terbakar|api terdeteksi|darurat nasional|terkonfirmasi/i,
    )
  })

  it('risk tooltip is hotspot count, not FWI', () => {
    expect(copy.detail.riskTooltip).toMatch(/titik panas/i)
    expect(copy.detail.riskTooltip).not.toMatch(/FWI|BMKG/)
  })
})

describe('compareRegionsByRisk', () => {
  it('orders by kategori then titik panas descending', () => {
    const list = [
      { risk_category: 'rendah' as const, hotspots_24h: 0 },
      { risk_category: 'sangat_tinggi' as const, hotspots_24h: 2 },
      { risk_category: 'sedang' as const, hotspots_24h: 5 },
      { risk_category: 'sangat_tinggi' as const, hotspots_24h: 10 },
      { risk_category: 'sedang' as const, hotspots_24h: 8 },
    ]
    const sorted = [...list].sort(compareRegionsByRisk)
    expect(sorted.map((r) => [r.risk_category, r.hotspots_24h])).toEqual([
      ['sangat_tinggi', 10],
      ['sangat_tinggi', 2],
      ['sedang', 8],
      ['sedang', 5],
      ['rendah', 0],
    ])
  })
})
