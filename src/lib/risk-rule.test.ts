import { describe, expect, it } from 'vitest'

import { copy } from '@/copy/id'
import {
  compareRegionsByRisk,
  effectiveRiskCategory,
  worstRiskCategory,
} from '@/lib/risk-rule'

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
    expect(copy.detail.riskTooltip).toMatch(/NASA FIRMS/i)
    expect(copy.detail.riskTooltip).not.toMatch(/FWI|BMKG/)
  })
})

describe('effectiveRiskCategory', () => {
  it('keeps API kategori when set and there are detections', () => {
    expect(effectiveRiskCategory({ risk_category: 'sedang', hotspots_24h: 99 })).toBe(
      'sedang',
    )
    expect(effectiveRiskCategory({ risk_category: 'rendah', hotspots_24h: 2 })).toBe(
      'rendah',
    )
  })

  it('maps null/tidak_tersedia from hotspot count', () => {
    expect(
      effectiveRiskCategory({ risk_category: 'tidak_tersedia', hotspots_24h: 11 }),
    ).toBe('sangat_tinggi')
    expect(
      effectiveRiskCategory({ risk_category: 'tidak_tersedia', hotspots_24h: 4 }),
    ).toBe('sedang')
  })

  it('maps zero hotspots to tanpa_titik, never rendah', () => {
    expect(
      effectiveRiskCategory({ risk_category: 'tidak_tersedia', hotspots_24h: 0 }),
    ).toBe('tanpa_titik')
    expect(effectiveRiskCategory({ risk_category: 'rendah', hotspots_24h: 0 })).toBe(
      'tanpa_titik',
    )
    expect(
      effectiveRiskCategory({ risk_category: 'sangat_tinggi', hotspots_24h: 0 }),
    ).toBe('tanpa_titik')
  })

  it('maps null, undefined, NaN, and negative to tidak_tersedia', () => {
    expect(
      effectiveRiskCategory({
        risk_category: 'rendah',
        hotspots_24h: null,
      }),
    ).toBe('tidak_tersedia')
    expect(
      effectiveRiskCategory({
        risk_category: 'sedang',
        hotspots_24h: undefined,
      }),
    ).toBe('tidak_tersedia')
    expect(
      effectiveRiskCategory({
        risk_category: 'sangat_tinggi',
        hotspots_24h: Number.NaN,
      }),
    ).toBe('tidak_tersedia')
    expect(
      effectiveRiskCategory({
        risk_category: 'rendah',
        hotspots_24h: -1,
      }),
    ).toBe('tidak_tersedia')
  })
})

describe('compareRegionsByRisk', () => {
  it('orders by kategori then titik panas, tanpa_titik last', () => {
    const list = [
      { risk_category: 'rendah' as const, hotspots_24h: 0 },
      { risk_category: 'sangat_tinggi' as const, hotspots_24h: 2 },
      { risk_category: 'sedang' as const, hotspots_24h: 5 },
      { risk_category: 'sangat_tinggi' as const, hotspots_24h: 10 },
      { risk_category: 'sedang' as const, hotspots_24h: 8 },
      { risk_category: 'rendah' as const, hotspots_24h: 1 },
    ]
    const sorted = [...list].sort(compareRegionsByRisk)
    expect(sorted.map((r) => [effectiveRiskCategory(r), r.hotspots_24h])).toEqual([
      ['sangat_tinggi', 10],
      ['sangat_tinggi', 2],
      ['sedang', 8],
      ['sedang', 5],
      ['rendah', 1],
      ['tanpa_titik', 0],
    ])
  })
})

describe('worstRiskCategory', () => {
  it('uses the worst effective kategori among regions, not hotspot sum', () => {
    expect(
      worstRiskCategory([
        { risk_category: 'sedang', hotspots_24h: 7 },
        { risk_category: 'rendah', hotspots_24h: 20 },
      ]),
    ).toBe('sedang')
    expect(
      worstRiskCategory([{ risk_category: 'tidak_tersedia', hotspots_24h: 23 }]),
    ).toBe('sangat_tinggi')
    expect(worstRiskCategory([])).toBe('tidak_tersedia')
    expect(
      worstRiskCategory([
        { risk_category: 'rendah', hotspots_24h: 0 },
        { risk_category: 'tidak_tersedia', hotspots_24h: 0 },
      ]),
    ).toBe('tanpa_titik')
    expect(
      worstRiskCategory([
        { risk_category: 'rendah', hotspots_24h: null },
        { risk_category: 'sedang', hotspots_24h: undefined },
      ]),
    ).toBe('tidak_tersedia')
  })
})
