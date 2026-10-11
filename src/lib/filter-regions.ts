import Fuse from 'fuse.js'

import type { Region, RiskCategory } from '@/data/types'
import { compareRegionsByRisk } from '@/lib/risk-rule'

export type RegionFilterState = {
  province: string
  selectedCategories: ReadonlySet<RiskCategory>
  query: string
}

export function filterRegions(list: Region[], state: RegionFilterState): Region[] {
  let result = list

  if (state.province !== 'Semua') {
    result = result.filter((r) => r.province === state.province)
  }

  if (state.selectedCategories.size > 0) {
    result = result.filter((r) => state.selectedCategories.has(r.risk_category))
  }

  const q = state.query.trim()
  if (q) {
    const fuse = new Fuse(result, {
      keys: ['name', 'province'],
      threshold: 0.35,
    })
    result = fuse.search(q).map((r) => r.item)
  }

  return [...result].sort(compareRegionsByRisk)
}
