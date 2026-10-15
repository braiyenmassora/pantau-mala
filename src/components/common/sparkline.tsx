import { hotspotTrend } from '@/lib/hotspot-trend'
import { cn } from '@/lib/utils'

type SparklineProps = {
  data: readonly number[]
  width?: number
  height?: number
  className?: string
  showDot?: boolean
  ariaLabel?: string
}

// ponytail: kurva Catmull-Rom cubic bezier 7 hari. Upgrade ke chart canvas jika butuh tooltip/hover tanggal.
export function Sparkline({
  data,
  width = 44,
  height = 18,
  className,
  showDot = true,
  ariaLabel,
}: SparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const allZero = max === 0
  const flat = max === min
  const range = flat ? 1 : max - min
  const pad = 3

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: flat
      ? allZero
        ? height - pad
        : height / 2
      : height - pad - ((v - min) / range) * (height - pad * 2),
  }))

  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  const trend = hotspotTrend(data)
  const colorClass =
    trend === 'naik'
      ? 'text-risk-high'
      : trend === 'turun'
        ? 'text-risk-low'
        : 'text-ink-3'

  const lastPt = pts[pts.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0 overflow-visible', colorClass, className)}
      role="img"
      aria-label={ariaLabel ?? `Tren 7 hari: ${trend}`}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot ? (
        <circle
          cx={Number(lastPt.x.toFixed(1))}
          cy={Number(lastPt.y.toFixed(1))}
          r={2}
          fill="currentColor"
        />
      ) : null}
    </svg>
  )
}
