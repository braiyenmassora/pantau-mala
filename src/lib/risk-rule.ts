import type { RiskCategory } from '@/data/types'

/** Categories are supplied by the Go API; the frontend never reclassifies counts. */
/** Urutan daftar: Sangat tinggi dulu, lalu Sedang, lalu Rendah. */
export const RISK_SORT_RANK: Record<RiskCategory, number> = {
  tidak_tersedia: 3,
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
