import Fuse from 'fuse.js'

import type { Region, RiskCategory } from '@/data/types'
import { compareRegionsByRisk, effectiveRiskCategory } from '@/lib/risk-rule'

/** Pin peta nasional: sedang + sangat tinggi. */
export const MAP_RISK_CATEGORIES = new Set<RiskCategory>(['sangat_tinggi', 'sedang'])

/**
 * Daftar filter Semua: risiko + belum dinilai + nol titik (paling bawah).
 * Chip UI hanya sangat_tinggi / sedang / rendah — tanpa_titik tidak punya chip.
 */
export const LIST_RISK_CATEGORIES = new Set<RiskCategory>([
  'sangat_tinggi',
  'sedang',
  'rendah',
  'tidak_tersedia',
  'tanpa_titik',
])

export type RegionFilterState = {
  province: string
  selectedCategories: ReadonlySet<RiskCategory>
  query: string
}

export function filterRegions(list: Region[], state: RegionFilterState): Region[] {
  let result = list.filter((r) => LIST_RISK_CATEGORIES.has(effectiveRiskCategory(r)))

  if (state.province !== 'Semua') {
    result = result.filter((r) => r.province === state.province)
  }

  if (state.selectedCategories.size > 0) {
    result = result.filter((r) => state.selectedCategories.has(effectiveRiskCategory(r)))
  }

  const q = state.query.trim()
  if (q) {
    const fuse = new Fuse(result, {
      keys: ['name', 'province'],
      // Lebih ketat dari 0.35 agar "pulang" tidak menyeret Malang/Subang.
      threshold: 0.28,
    })
    const qLower = q.toLowerCase()
    result = fuse
      .search(q)
      .map((r) => r.item)
      .sort((a, b) => {
        const rank = (name: string) => {
          const n = name.toLowerCase()
          if (n.startsWith(qLower)) return 0
          if (n.includes(qLower)) return 1
          return 2
        }
        const d = rank(a.name) - rank(b.name)
        if (d !== 0) return d
        return compareRegionsByRisk(a, b)
      })
    return result
  }

  return [...result].sort(compareRegionsByRisk)
}
