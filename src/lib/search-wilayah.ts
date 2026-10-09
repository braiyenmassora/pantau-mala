import Fuse from 'fuse.js'

import type {
  CatalogKabKota,
  CatalogProvince,
  DaftarWilayah,
  Region,
} from '@/data/types'

export type ProvinceSearchHit = {
  province: CatalogProvince
  /** Regions in wilayah.json for this province (hotspot data). */
  hotspotCount: number
  score: number
}

export type KabSearchHit = {
  kab: CatalogKabKota
  region: Region | null
  score: number
}

export type SearchWilayahResult = {
  provinces: ProvinceSearchHit[]
  kabkota: KabSearchHit[]
}

const PROV_LIMIT = 3
const KAB_LIMIT = 8

/** Fuse search over catalog, merge with hotspot regions. Best name match first, then score. */
export function searchWilayah(
  daftar: DaftarWilayah,
  regions: Region[],
  query: string,
): SearchWilayahResult {
  const q = query.trim()
  if (!q) return { provinces: [], kabkota: [] }

  const byKode = new Map(regions.map((r) => [r.kode, r]))
  const hotspotByProv = new Map<string, number>()
  for (const r of regions) {
    hotspotByProv.set(r.provinsi, (hotspotByProv.get(r.provinsi) ?? 0) + 1)
  }

  const provFuse = new Fuse(daftar.provinsi, {
    keys: ['nama'],
    threshold: 0.4,
    includeScore: true,
  })
  const kabFuse = new Fuse(daftar.kabkota, {
    keys: ['nama', 'provinsi'],
    threshold: 0.4,
    includeScore: true,
  })

  const provinces = provFuse
    .search(q)
    .slice(0, PROV_LIMIT)
    .map((hit) => ({
      province: hit.item,
      hotspotCount: hotspotByProv.get(hit.item.nama) ?? 0,
      score: hit.score ?? 1,
    }))
    .sort((a, b) => a.score - b.score || b.hotspotCount - a.hotspotCount)

  const kabkota = kabFuse
    .search(q)
    .slice(0, KAB_LIMIT)
    .map((hit) => {
      const region = byKode.get(hit.item.kode) ?? null
      return {
        kab: hit.item,
        region,
        score: hit.score ?? 1,
      }
    })
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return (b.region?.skor ?? -1) - (a.region?.skor ?? -1)
    })

  return { provinces, kabkota }
}
