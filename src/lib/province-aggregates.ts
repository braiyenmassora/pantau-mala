import type { CatalogProvince, Region, RiskCategory } from '@/data/types'
import { RISK_SORT_RANK, effectiveRiskCategory } from '@/lib/risk-rule'

export type ProvinceAggregate = {
  name: string
  center: [number, number]
  bbox: [number, number, number, number]
  hotspots_24h: number
  risk_category: RiskCategory
  trend_7d: [number, number, number, number, number, number, number]
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
    const risk = effectiveRiskCategory(r)
    const prev = riskByName.get(r.province)
    if (!prev || RISK_SORT_RANK[risk] < RISK_SORT_RANK[prev])
      riskByName.set(r.province, risk)
    byName.set(r.province, (byName.get(r.province) ?? 0) + r.hotspots_24h)

    const prevTrend = trendByName.get(r.province) ?? [0, 0, 0, 0, 0, 0, 0]
    trendByName.set(r.province, [
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
    const hotspots_24h = byName.get(p.name) ?? 0
    if (hotspots_24h <= 0) continue
    out.push({
      name: p.name,
      center: p.center,
      bbox: p.bbox,
      hotspots_24h,
      risk_category: opts?.pinRisk ?? riskByName.get(p.name) ?? 'tidak_tersedia',
      trend_7d: trendByName.get(p.name) ?? [0, 0, 0, 0, 0, 0, 0],
    })
  }
  return out.sort((a, b) => b.hotspots_24h - a.hotspots_24h)
}
