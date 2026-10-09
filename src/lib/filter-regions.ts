import Fuse from 'fuse.js'

import type { Region, RiskCategory } from '@/data/types'

export type RegionFilterState = {
  province: string
  selectedCategories: ReadonlySet<RiskCategory>
  query: string
}

export function filterRegions(list: Region[], state: RegionFilterState): Region[] {
  let result = list

  if (state.province !== 'Semua') {
    result = result.filter((r) => r.provinsi === state.province)
  }

  if (state.selectedCategories.size > 0) {
    result = result.filter((r) => state.selectedCategories.has(r.kategori))
  }

  const q = state.query.trim()
  if (q) {
    const fuse = new Fuse(result, {
      keys: ['nama', 'provinsi'],
      threshold: 0.35,
    })
    result = fuse.search(q).map((r) => r.item)
  }

  return [...result].sort((a, b) => b.skor - a.skor)
}
