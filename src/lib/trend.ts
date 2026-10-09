export type TrendLabel = '↑ naik' | '↓ turun' | '→ stabil'

/** Up if day 7 > 115% of day 1, down if < 85%, otherwise stable. */
export function trendLabel(trend7d: number[]): TrendLabel {
  const first = trend7d[0] ?? 0
  const last = trend7d[trend7d.length - 1] ?? 0
  if (last > first * 1.15) return '↑ naik'
  if (last < first * 0.85) return '↓ turun'
  return '→ stabil'
}
