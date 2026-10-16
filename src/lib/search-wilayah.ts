import Fuse from 'fuse.js'

import type { CatalogProvince, CatalogRegency, Region, RegionCatalog } from '@/data/types'
import { compareRegionsByRisk } from '@/lib/risk-rule'

export type ProvinceSearchHit = {
  province: CatalogProvince
  /** Regions with hotspot data for this province. */
  hotspotCount: number
  score: number
}

export type KabSearchHit = {
  kab: CatalogRegency
  region: Region | null
  score: number
}

export type SearchWilayahResult = {
  provinces: ProvinceSearchHit[]
  /** Search hits for kab/kota (UI label); not the catalog wire key. */
  kabkota: KabSearchHit[]
}

const PROV_LIMIT = 3
const KAB_LIMIT = 8

/** Fuse search over catalog, merge with hotspot regions. Best name match first, then score. */
export function searchWilayah(
  catalog: RegionCatalog,
  regions: Region[],
  query: string,
): SearchWilayahResult {
  const q = query.trim()
  if (!q) return { provinces: [], kabkota: [] }

  const byCode = new Map(regions.map((r) => [r.code, r]))
  const hotspotByProv = new Map<string, number>()
  for (const r of regions) {
    hotspotByProv.set(r.province, (hotspotByProv.get(r.province) ?? 0) + 1)
  }

  const qLower = q.toLowerCase()
  const prefixBoost = (name: string, score: number) => {
    const n = name.toLowerCase()
    if (n.startsWith(qLower)) return score - 0.2
    if (n.includes(qLower)) return score - 0.05
    return score
  }

  const provFuse = new Fuse(catalog.provinces, {
    keys: ['name'],
    threshold: 0.32,
    includeScore: true,
  })
  const kabFuse = new Fuse(catalog.regencies, {
    keys: ['name', 'province'],
    threshold: 0.32,
    includeScore: true,
  })

  const provinces = provFuse
    .search(q)
    .slice(0, PROV_LIMIT)
    .map((hit) => ({
      province: hit.item,
      hotspotCount: hotspotByProv.get(hit.item.name) ?? 0,
      score: prefixBoost(hit.item.name, hit.score ?? 1),
    }))
    .sort((a, b) => a.score - b.score || b.hotspotCount - a.hotspotCount)

  const kabkota = kabFuse
    .search(q)
    .slice(0, KAB_LIMIT)
    .map((hit) => {
      const region = byCode.get(hit.item.code) ?? null
      return {
        kab: hit.item,
        region,
        score: prefixBoost(hit.item.name, hit.score ?? 1),
      }
    })
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      if (a.region && b.region) return compareRegionsByRisk(a.region, b.region)
      if (a.region) return -1
      if (b.region) return 1
      return 0
    })

  return { provinces, kabkota }
}
