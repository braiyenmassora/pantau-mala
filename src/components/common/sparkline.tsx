import { useId } from 'react'

import { getCopy } from '@/copy'
import { cn } from '@/lib/utils'

type SparklineProps = {
  data: readonly number[]
  width?: number
  height?: number
  className?: string
  ariaLabel?: string
  /** false = polyline (aman untuk chart panel; bezier bisa overshoot + terpotong). */
  smooth?: boolean
}

type Point = { x: number; y: number }

function linearPath(pts: readonly Point[]): string {
  if (pts.length === 0) return ''
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
}

function smoothPath(pts: readonly Point[]): string {
  if (pts.length < 2) return ''
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
  return path
}

function areaUnder(line: string, pts: readonly Point[], height: number): string {
  if (!line || pts.length === 0) return ''
  const first = pts[0]
  const last = pts.at(-1)!
  return `${line} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`
}

/** Mini sparkline daftar — default warna chart netral (bukan brand hijau).
 * Override className ke text-risk-* bila baris punya kategori risiko. */
export function Sparkline({
  data,
  width = 56,
  height = 20,
  className,
  ariaLabel,
  smooth = true,
}: SparklineProps) {
  const gradId = useId().replaceAll(':', '')
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const allZero = max === 0
  const flat = max === min
  const range = flat ? 1 : max - min
  const padX = 2
  // Panel chart: padding lebih besar agar titik min/max + stroke tidak terpotong.
  const padY = height >= 28 ? 6 : 3

  const pts = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * (width - padX * 2),
    y: flat
      ? allZero
        ? height - padY
        : height / 2
      : height - padY - ((v - min) / range) * (height - padY * 2),
  }))

  const line = smooth ? smoothPath(pts) : linearPath(pts)
  const area = areaUnder(line, pts, height)
  const end = pts.at(-1)!

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('text-chart shrink-0 overflow-visible', className)}
      role="img"
      aria-label={ariaLabel ?? getCopy().extra.trendChart}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={end.x}
        cy={end.y}
        r={2}
        fill="currentColor"
        stroke="var(--color-surface)"
        strokeWidth={1}
      />
    </svg>
  )
}
