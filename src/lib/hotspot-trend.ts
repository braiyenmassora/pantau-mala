export type TrendDirection = 'naik' | 'turun' | 'stabil'

/**
 * Arah tren dari deret 7 hari: bandingkan rata-rata 3 hari awal vs 3 hari akhir.
 * Ambang kecil → stabil (hindari noise 1 titik).
 */
export function hotspotTrend(trend: readonly number[]): TrendDirection {
  if (trend.length < 2) return 'stabil'
  const early = trend.slice(0, 3)
  const late = trend.slice(-3)
  const avg = (xs: readonly number[]) =>
    xs.reduce((s, n) => s + n, 0) / Math.max(1, xs.length)
  const a = avg(early)
  const b = avg(late)
  const delta = b - a
  const floor = Math.max(1, a * 0.05)
  if (Math.abs(delta) <= floor) return 'stabil'
  return delta > 0 ? 'naik' : 'turun'
}
