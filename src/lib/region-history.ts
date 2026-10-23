import type { RegionHistoryRow, WindyPoint } from '@/data/extended-contract'

/** Series titik panas dari `/history`, fallback ke `trend_7d` wilayah. */
export function trendValuesFromHistory(
  rows: RegionHistoryRow[] | undefined,
  fallback: readonly number[],
): number[] {
  if (!rows?.length) return [...fallback]
  return rows.map((row) => row.titik_panas)
}

/** Skor harian terbaru yang ada angkanya. */
export function latestHistoryScore(rows: RegionHistoryRow[] | undefined): number | null {
  if (!rows?.length) return null
  for (let i = rows.length - 1; i >= 0; i--) {
    const skor = rows[i]?.skor
    if (skor != null && Number.isFinite(skor)) return skor
  }
  return null
}

/** Debit terbaru yang ada angkanya (null di ujung diabaikan). */
export function latestDischargeM3s(
  values: readonly (number | null)[] | undefined,
): number | null {
  if (!values?.length) return null
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i]
    if (v != null && Number.isFinite(v)) return v
  }
  return null
}

/** Series debit untuk sparkline — null jadi 0 agar panjang tetap. */
export function dischargeSeries(
  values: readonly (number | null)[] | undefined,
): number[] {
  if (!values?.length) return []
  return values.map((v) => (v != null && Number.isFinite(v) ? v : 0))
}

/** Titik Windy paling dekat ke sekarang. */
export function nearestWindyPoint(
  points: readonly WindyPoint[] | undefined,
  now = Date.now(),
): WindyPoint | undefined {
  if (!points?.length) return undefined
  let best = points[0]!
  let bestDist = Math.abs(best.ts - now)
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!
    const d = Math.abs(p.ts - now)
    if (d < bestDist) {
      best = p
      bestDist = d
    }
  }
  return best
}
