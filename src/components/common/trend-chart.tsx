import { useId } from 'react'

import type { TimeZoneId } from '@/data/types'
import { getCopy } from '@/copy'
import { chartScaleMax, formatNumber, formatTrendDates } from '@/lib/format'
import { cn } from '@/lib/utils'

type TrendTone = 'chart' | 'risk-high' | 'risk-mid' | 'risk-low'

const TONE_CSS: Record<TrendTone, string> = {
  chart: 'var(--color-chart)',
  'risk-high': 'var(--color-risk-high)',
  'risk-mid': 'var(--color-risk-mid)',
  'risk-low': 'var(--color-risk-low)',
}

type TrendChartProps = {
  values: readonly number[]
  timeZone: TimeZoneId
  label?: string
  /** Opsional — biasanya disembunyikan agar hierarki lebih bersih. */
  description?: string | null
  /** Label untuk hari terakhir yang belum penuh, mis. "21:06 WIB". */
  partialUntil?: string | null
  /** Warna kurva — default chart netral; risiko untuk detail wilayah. */
  tone?: TrendTone
  className?: string
}

const VIEWBOX_WIDTH = 360
const VIEWBOX_HEIGHT = 128
const PLOT_LEFT = 32
const PLOT_RIGHT = 8
const PLOT_TOP = 10
const PLOT_BOTTOM = 100

type Point = { x: number; y: number }

function smoothLinePath(points: readonly Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function areaPath(line: string, points: readonly Point[]): string {
  if (!line || points.length === 0) return ''
  const first = points[0]
  const last = points.at(-1)!
  return `${line} L ${last.x} ${PLOT_BOTTOM} L ${first.x} ${PLOT_BOTTOM} Z`
}

function dayLabel(date: string): string {
  const day = date.split(' ')[0] ?? date
  return String(Number.parseInt(day, 10) || day)
}

/** Grafik tren 7 hari — judul satu baris, chart, lalu 3 meta mono. */
export function TrendChart({
  values,
  timeZone,
  label = getCopy().extra.trendChart,
  description = null,
  partialUntil,
  tone = 'chart',
  className,
}: TrendChartProps) {
  const titleId = useId().replaceAll(':', '')
  const gradId = `${titleId}-area`
  const stroke = TONE_CSS[tone]
  const safeValues = values
    .slice(-7)
    .map((value) => (Number.isFinite(value) && value >= 0 ? value : 0))
  const dates = formatTrendDates(timeZone).slice(-safeValues.length)

  if (safeValues.length === 0) {
    return (
      <section
        className={cn('space-y-2', className)}
        aria-labelledby={`${titleId}-title`}
      >
        <h3 id={`${titleId}-title`} className="text-ink-2 text-xs leading-4 font-medium">
          {label}
        </h3>
        <p className="text-ink-2 text-xs leading-4">
          {getCopy().extra.trendChartUnavailable}
        </p>
      </section>
    )
  }

  const maximum = Math.max(...safeValues)
  const scaleMaximum = chartScaleMax(maximum)
  const range = PLOT_BOTTOM - PLOT_TOP
  const step =
    (VIEWBOX_WIDTH - PLOT_LEFT - PLOT_RIGHT) / Math.max(1, safeValues.length - 1)
  const points = safeValues.map((value, index) => ({
    x: PLOT_LEFT + step * index,
    y: PLOT_BOTTOM - (value / scaleMaximum) * range,
  }))

  const fullLine = smoothLinePath(points)
  const fill = areaPath(fullLine, points)
  const partialLine = points.length >= 2 ? smoothLinePath(points.slice(-2)) : ''

  const average = Math.round(
    safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length,
  )
  const latest = safeValues.at(-1) ?? 0
  const peak = Math.max(...safeValues)
  const tickValues = [scaleMaximum, scaleMaximum / 2, 0]
  const ariaValues = safeValues
    .map((value, index) => `${dates[index]} ${value}`)
    .join(', ')
  const untilLabel = partialUntil ?? null

  return (
    <section className={cn('space-y-3', className)} aria-labelledby={`${titleId}-title`}>
      <div className="min-w-0">
        <h3 id={`${titleId}-title`} className="text-ink-2 text-xs leading-4 font-medium">
          {label}
        </h3>
        {description ? (
          <p className="text-ink-2 mt-2 text-xs leading-4">{description}</p>
        ) : null}
      </div>

      <div>
        <svg
          className="h-24 w-full overflow-visible"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          role="img"
          aria-label={`${label}. ${ariaValues}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>

          {tickValues.map((value, index) => {
            const y = PLOT_TOP + (range / 2) * index
            return (
              <g key={`${value}-${index}`}>
                <line
                  x1={PLOT_LEFT}
                  x2={VIEWBOX_WIDTH - PLOT_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="var(--color-line)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.7"
                />
                <text
                  x={PLOT_LEFT - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-ink-3 font-mono"
                  fontSize="10"
                >
                  {formatNumber(value)}
                </text>
              </g>
            )
          })}

          {fill ? <path d={fill} fill={`url(#${gradId})`} aria-hidden /> : null}

          <path
            d={fullLine}
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {partialLine && points.length >= 2 ? (
            <path
              d={partialLine}
              fill="none"
              stroke={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              strokeDasharray="5 4"
              vectorEffect="non-scaling-stroke"
              opacity="0.85"
            />
          ) : null}

          {untilLabel && points.length > 0 ? (
            <text
              x={points.at(-1)!.x}
              y={Math.max(PLOT_TOP + 10, points.at(-1)!.y - 8)}
              textAnchor="end"
              className="fill-ink-3"
              fontSize="10"
            >
              {getCopy().extra.trendPartialToday(untilLabel)}
            </text>
          ) : null}
        </svg>

        <div className="text-ink-3 mt-1 flex justify-between pr-1 pl-8 text-xs leading-4">
          {dates.map((date, index) => (
            <span key={date} className={index % 2 === 1 ? 'invisible' : undefined}>
              {dayLabel(date)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <TrendStat label={getCopy().extra.trendLatest} value={latest} />
        <TrendStat label={getCopy().extra.trendPeak} value={peak} />
        <TrendStat label={getCopy().extra.trendAverage} value={average} />
      </div>
    </section>
  )
}

function TrendStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-ink-2 truncate text-xs leading-4">{label}</p>
      <p className="text-ink font-mono text-sm leading-5 font-semibold tabular-nums">
        {formatNumber(value)}
      </p>
    </div>
  )
}
