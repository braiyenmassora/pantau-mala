import type { Region, RiskCategory } from '@/data/types'

export type RegionSummary = {
  /** Σ hotspots_24h (filter aktif) — angka kartu utama. */
  todayTotal: number
  countByCategory: Record<RiskCategory, number>
}

/** MVP: hanya agregat hari ini. Tren 7 hari / % vs kemarin post-MVP. */
export function computeSummary(list: Region[]): RegionSummary {
  const todayTotal = list.reduce((sum, r) => sum + r.hotspots_24h, 0)

  const countByCategory: Record<RiskCategory, number> = {
    sangat_tinggi: 0,
    sedang: 0,
    rendah: 0,
  }
  for (const r of list) countByCategory[r.risk_category] += 1

  return { todayTotal, countByCategory }
}
