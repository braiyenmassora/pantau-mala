import type { RiskCategory } from '@/data/types'

/**
 * Urutan daftar: Sangat tinggi → Sedang → Rendah → Belum dinilai →
 * Tidak ada titik panas terdeteksi. Nol titik selalu di bawah; hanya di filter Semua.
 */
export const RISK_SORT_RANK: Record<RiskCategory, number> = {
  sangat_tinggi: 0,
  sedang: 1,
  rendah: 2,
  tidak_tersedia: 3,
  tanpa_titik: 4,
}

/** Hitungan titik valid: bilangan hingga ≥ 0. null/NaN/negatif = tidak tersedia. */
export function isValidHotspotCount(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
}

export type RiskInput = {
  risk_category: RiskCategory
  hotspots_24h: number | null | undefined
}

/**
 * Kategori tampilan peta/daftar/filter.
 * Hanya 0 valid → `tanpa_titik`. null/undefined/NaN → `tidak_tersedia`.
 */
export function effectiveRiskCategory(r: RiskInput): RiskCategory {
  if (!isValidHotspotCount(r.hotspots_24h)) return 'tidak_tersedia'
  if (r.hotspots_24h === 0) return 'tanpa_titik'
  if (r.risk_category !== 'tidak_tersedia' && r.risk_category !== 'tanpa_titik') {
    return r.risk_category
  }
  if (r.hotspots_24h >= 10) return 'sangat_tinggi'
  if (r.hotspots_24h >= 1) return 'sedang'
  return 'tidak_tersedia'
}

export function compareRegionsByRisk(a: RiskInput, b: RiskInput): number {
  const byCat =
    RISK_SORT_RANK[effectiveRiskCategory(a)] - RISK_SORT_RANK[effectiveRiskCategory(b)]
  if (byCat !== 0) return byCat
  const ha = isValidHotspotCount(a.hotspots_24h) ? a.hotspots_24h : -1
  const hb = isValidHotspotCount(b.hotspots_24h) ? b.hotspots_24h : -1
  return hb - ha
}

/** Σ hitungan valid; `null` bila tidak ada angka valid sama sekali. */
export function sumValidHotspots(regions: RiskInput[]): number | null {
  let sum = 0
  let any = false
  for (const r of regions) {
    if (!isValidHotspotCount(r.hotspots_24h)) continue
    any = true
    sum += r.hotspots_24h
  }
  return any ? sum : null
}

/** Risiko panel/agregat = terburuk di kab/kota. Daftar kosong = belum ada data. */
export function worstRiskCategory(regions: RiskInput[]): RiskCategory {
  if (regions.length === 0) return 'tidak_tersedia'
  let worst: RiskCategory = 'tanpa_titik'
  for (const r of regions) {
    const next = effectiveRiskCategory(r)
    if (RISK_SORT_RANK[next] < RISK_SORT_RANK[worst]) worst = next
  }
  return worst
}
