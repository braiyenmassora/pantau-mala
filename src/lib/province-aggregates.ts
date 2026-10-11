import type { CatalogProvince, Region, RiskCategory } from '@/data/types'
import { computeRiskCategory } from '@/lib/risk-rule'

export type ProvinceAggregate = {
  name: string
  center: [number, number]
  bbox: [number, number, number, number]
  hotspots_24h: number
  risk_category: RiskCategory
}

type AggregateOpts = {
  /**
   * Saat filter chip kategori aktif: jangan hitung ulang risk dari Σ
   * (banyak kab "sedang" bisa Σ≥10 → pin merah palsu).
   */
  pinRisk?: RiskCategory
}

/** Jumlahkan hotspots_24h per nama provinsi; pusat/bbox dari catalog. */
export function aggregateByProvince(
  regions: Region[],
  provinces: CatalogProvince[],
  opts?: AggregateOpts,
): ProvinceAggregate[] {
  const byName = new Map<string, number>()
  for (const r of regions) {
    byName.set(r.province, (byName.get(r.province) ?? 0) + r.hotspots_24h)
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
      risk_category: opts?.pinRisk ?? computeRiskCategory(hotspots_24h),
    })
  }
  return out.sort((a, b) => b.hotspots_24h - a.hotspots_24h)
}
