import distance from '@turf/distance'

import type { CatalogProvince, Region, RegionCatalog, RiskCategory } from '@/data/types'
import { validCoordinates } from '@/lib/environment-data'
import { normalizeProvinceName } from '@/lib/province-boundaries'
import { RISK_SORT_RANK, effectiveRiskCategory } from '@/lib/risk-rule'

export type ProvinceAggregate = {
  name: string
  center: [number, number]
  bbox: [number, number, number, number]
  hotspots_24h: number
  risk_category: RiskCategory
  trend_7d: [number, number, number, number, number, number, number]
}

export function provinceLabelAnchors(
  catalog: RegionCatalog,
  regions: Region[] = [],
): CatalogProvince[] {
  const active = new Map<string, Region>()
  for (const region of regions) {
    if (region.hotspots_24h <= 0) continue
    if (!validCoordinates(...region.center)) continue
    const key = normalizeProvinceName(region.province)
    const current = active.get(key)
    if (
      !current ||
      region.hotspots_24h > current.hotspots_24h ||
      (region.hotspots_24h === current.hotspots_24h && region.code < current.code)
    ) {
      active.set(key, region)
    }
  }

  return catalog.provinces.flatMap((province) => {
    if (!validCoordinates(...province.center)) return []
    const name = normalizeProvinceName(province.name)
    const activeRegion = active.get(name)
    if (activeRegion) return [{ ...province, center: activeRegion.center }]
    const [minLongitude, minLatitude, maxLongitude, maxLatitude] = province.bbox
    let nearest: RegionCatalog['regencies'][number] | undefined
    let nearestDistance = Infinity

    for (const regency of catalog.regencies) {
      if (normalizeProvinceName(regency.province) !== name) continue
      const [longitude, latitude] = regency.center
      if (
        !validCoordinates(longitude, latitude) ||
        longitude < minLongitude || longitude > maxLongitude ||
        latitude < minLatitude || latitude > maxLatitude
      ) continue
      const candidateDistance = distance(province.center, regency.center)
      if (
        candidateDistance < nearestDistance ||
        (candidateDistance === nearestDistance && nearest && regency.code < nearest.code)
      ) {
        nearest = regency
        nearestDistance = candidateDistance
      }
    }

    return [nearest ? { ...province, center: nearest.center } : province]
  })
}

type AggregateOpts = {
  /**
   * Saat filter chip kategori aktif: jangan hitung ulang risk dari Σ
   * (banyak kab "sedang" bisa Σ≥10 → pin merah palsu).
   */
  pinRisk?: RiskCategory
}

/** Jumlahkan hotspots_24h & trend_7d per nama provinsi; pusat/bbox dari catalog. */
export function aggregateByProvince(
  regions: Region[],
  provinces: CatalogProvince[],
  opts?: AggregateOpts,
): ProvinceAggregate[] {
  const byName = new Map<string, number>()
  const riskByName = new Map<string, RiskCategory>()
  const trendByName = new Map<
    string,
    [number, number, number, number, number, number, number]
  >()
  for (const r of regions) {
    const provinceName = normalizeProvinceName(r.province)
    const risk = effectiveRiskCategory(r)
    const prev = riskByName.get(provinceName)
    if (!prev || RISK_SORT_RANK[risk] < RISK_SORT_RANK[prev])
      riskByName.set(provinceName, risk)
    byName.set(provinceName, (byName.get(provinceName) ?? 0) + r.hotspots_24h)

    const prevTrend = trendByName.get(provinceName) ?? [0, 0, 0, 0, 0, 0, 0]
    trendByName.set(provinceName, [
      prevTrend[0] + (r.trend_7d?.[0] ?? 0),
      prevTrend[1] + (r.trend_7d?.[1] ?? 0),
      prevTrend[2] + (r.trend_7d?.[2] ?? 0),
      prevTrend[3] + (r.trend_7d?.[3] ?? 0),
      prevTrend[4] + (r.trend_7d?.[4] ?? 0),
      prevTrend[5] + (r.trend_7d?.[5] ?? 0),
      prevTrend[6] + (r.trend_7d?.[6] ?? 0),
    ])
  }

  const out: ProvinceAggregate[] = []
  for (const p of provinces) {
    const provinceName = normalizeProvinceName(p.name)
    const hotspots_24h = byName.get(provinceName) ?? 0
    if (hotspots_24h <= 0) continue
    out.push({
      name: p.name,
      center: p.center,
      bbox: p.bbox,
      hotspots_24h,
      risk_category: opts?.pinRisk ?? riskByName.get(provinceName) ?? 'tidak_tersedia',
      trend_7d: trendByName.get(provinceName) ?? [0, 0, 0, 0, 0, 0, 0],
    })
  }
  return out.sort((a, b) => b.hotspots_24h - a.hotspots_24h)
}
