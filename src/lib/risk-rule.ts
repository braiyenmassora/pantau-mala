import type { RiskCategory } from '@/data/types'

/** Urutan daftar: Sangat tinggi dulu, lalu Sedang, lalu Rendah. */
export const RISK_SORT_RANK: Record<RiskCategory, number> = {
  tidak_tersedia: 3,
  sangat_tinggi: 0,
  sedang: 1,
  rendah: 2,
}

/**
 * Kategori tampilan peta/daftar.
 * Pakai kategori API bila ada; jika `tidak_tersedia` (kategori null),
 * turunkan dari jumlah titik panas 24 jam (aturan FIRMS count).
 */
export function effectiveRiskCategory(r: {
  risk_category: RiskCategory
  hotspots_24h: number
}): RiskCategory {
  if (r.risk_category !== 'tidak_tersedia') return r.risk_category
  if (r.hotspots_24h >= 10) return 'sangat_tinggi'
  if (r.hotspots_24h >= 1) return 'sedang'
  return 'rendah'
}

export function compareRegionsByRisk(
  a: { risk_category: RiskCategory; hotspots_24h: number },
  b: { risk_category: RiskCategory; hotspots_24h: number },
): number {
  const byCat =
    RISK_SORT_RANK[effectiveRiskCategory(a)] - RISK_SORT_RANK[effectiveRiskCategory(b)]
  if (byCat !== 0) return byCat
  return b.hotspots_24h - a.hotspots_24h
}

/** Risiko panel provinsi = terburuk di kab/kota (sama sumber dengan chip filter). */
export function worstRiskCategory(
  regions: { risk_category: RiskCategory; hotspots_24h: number }[],
): RiskCategory {
  let worst: RiskCategory = 'rendah'
  for (const r of regions) {
    const next = effectiveRiskCategory(r)
    if (RISK_SORT_RANK[next] < RISK_SORT_RANK[worst]) worst = next
  }
  return worst
}
