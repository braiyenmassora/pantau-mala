import type { RiskCategory } from '@/data/types'

/**
 * risk_category murni dari hotspots_24h (NASA FIRMS, conf sedang+tinggi).
 * BE menghitung; FE memakai ulang untuk tes / tooltip.
 * - sangat_tinggi ⇔ hotspots_24h ≥ 10
 * - sedang         ⇔ hotspots_24h 1 … 9
 * - rendah         ⇔ hotspots_24h = 0 (tidak dikirim di /v1/regions MVP)
 */
export function computeRiskCategory(hotspots24h: number): RiskCategory {
  if (hotspots24h >= 10) return 'sangat_tinggi'
  if (hotspots24h >= 1) return 'sedang'
  return 'rendah'
}

/** Urutan daftar: Sangat tinggi dulu, lalu Sedang, lalu Rendah. */
export const RISK_SORT_RANK: Record<RiskCategory, number> = {
  sangat_tinggi: 0,
  sedang: 1,
  rendah: 2,
}

export function compareRegionsByRisk(
  a: { risk_category: RiskCategory; hotspots_24h: number },
  b: { risk_category: RiskCategory; hotspots_24h: number },
): number {
  const byCat = RISK_SORT_RANK[a.risk_category] - RISK_SORT_RANK[b.risk_category]
  if (byCat !== 0) return byCat
  return b.hotspots_24h - a.hotspots_24h
}
