import type { Region, RiskCategory } from '@/data/types'

export type RegionSummary = {
  totalsByDay: number[]
  todayTotal: number
  yesterdayTotal: number
  /** Percent change vs yesterday; null if yesterday is 0 and today > 0. */
  changePercent: number | null
  countByCategory: Record<RiskCategory, number>
}

export function computeSummary(list: Region[]): RegionSummary {
  const totalsByDay = Array.from({ length: 7 }, (_, i) =>
    list.reduce((sum, r) => sum + (r.tren_7h[i] ?? 0), 0),
  )

  const yesterdayTotal = totalsByDay[5] ?? 0
  const todayTotal = totalsByDay[6] ?? 0

  let changePercent: number | null
  if (yesterdayTotal === 0) {
    // shortcut: cannot divide by zero; UI can show "baru" when null && todayTotal > 0
    changePercent = todayTotal === 0 ? 0 : null
  } else {
    changePercent = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
  }

  const countByCategory: Record<RiskCategory, number> = {
    sangat_tinggi: 0,
    sedang: 0,
    rendah: 0,
  }
  for (const r of list) countByCategory[r.kategori] += 1

  return {
    totalsByDay,
    todayTotal,
    yesterdayTotal,
    changePercent,
    countByCategory,
  }
}
