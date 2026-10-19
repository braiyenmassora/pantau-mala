import { useId } from 'react'

import type { TimeZoneId } from '@/data/types'
import { copy } from '@/copy/id'
import { formatNumber, formatTrendDates } from '@/lib/format'
import { cn } from '@/lib/utils'

type TrendChartProps = {
  values: readonly number[]
  timeZone: TimeZoneId
  label?: string
  description?: string
  className?: string
}

const VIEWBOX_WIDTH = 360
const VIEWBOX_HEIGHT = 132
const PLOT_LEFT = 36
const PLOT_RIGHT = 10
const PLOT_TOP = 12
const PLOT_BOTTOM = 104

function linePath(points: readonly { x: number; y: number }[]) {
  if (points.length === 0) return ''
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const midpoint = (previous.x + point.x) / 2
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

export function TrendChart({
  values,
  timeZone,
  label = copy.extra.trendChart,
  description = copy.extra.trendChartNote,
  className,
}: TrendChartProps) {
  const titleId = useId().replaceAll(':', '')
  const safeValues = values
    .slice(-7)
    .map((value) => (Number.isFinite(value) && value >= 0 ? value : 0))
  const dates = formatTrendDates(timeZone).slice(-safeValues.length)

  if (safeValues.length === 0) {
    return (
      <section className={cn('rounded-card bg-surface-muted p-3', className)}>
        <h3 className="text-ink text-sm font-semibold">{label}</h3>
        <p className="text-ink-2 mt-1 text-xs">{copy.extra.trendChartUnavailable}</p>
      </section>
    )
  }

  const maximum = Math.max(...safeValues)
  const scaleMaximum = maximum > 0 ? Math.ceil(maximum * 1.1) : 1
  const range = PLOT_BOTTOM - PLOT_TOP
  const step =
    (VIEWBOX_WIDTH - PLOT_LEFT - PLOT_RIGHT) / Math.max(1, safeValues.length - 1)
  const points = safeValues.map((value, index) => ({
    x: PLOT_LEFT + step * index,
    y: PLOT_BOTTOM - (value / scaleMaximum) * range,
  }))
  const path = linePath(points)
  const areaPath = `${path} L ${points.at(-1)?.x ?? PLOT_RIGHT} ${PLOT_BOTTOM} L ${PLOT_LEFT} ${PLOT_BOTTOM} Z`
  const average = Math.round(
    safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length,
  )
  const latest = safeValues.at(-1) ?? 0
  const peak = Math.max(...safeValues)
  const tickValues = [scaleMaximum, Math.round(scaleMaximum / 2), 0]
  const ariaValues = safeValues
    .map((value, index) => `${dates[index]} ${value}`)
    .join(', ')

  return (
    <section
      className={cn('rounded-card bg-brand-soft/40 p-4', className)}
      aria-labelledby={`${titleId}-title`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${titleId}-title`} className="text-ink text-sm font-semibold">
            {label}
          </h3>
          <p className="text-ink-2 mt-1 text-xs">{description}</p>
        </div>
        <span className="text-brand shrink-0 text-xs font-medium">7 hari</span>
      </div>

      <div className="mt-3">
        <svg
          className="h-32 w-full overflow-visible"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          role="img"
          aria-label={`${label}. ${ariaValues}`}
        >
          <defs>
            <linearGradient id={`${titleId}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {tickValues.map((value, index) => {
            const y = PLOT_TOP + (range / 2) * index
            return (
              <g key={value}>
                <line
                  x1={PLOT_LEFT}
                  x2={VIEWBOX_WIDTH - PLOT_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="var(--color-line)"
                  strokeDasharray="1 7"
                  strokeLinecap="round"
                  strokeOpacity="0.7"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={PLOT_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-ink-2 font-mono text-xs"
                >
                  {formatNumber(value)}
                </text>
              </g>
            )
          })}

          <path d={areaPath} fill={`url(#${titleId}-fill)`} aria-hidden />
          <path
            d={path}
            fill="none"
            stroke="var(--color-brand)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((point, index) => (
            <circle
              key={`${dates[index]}-${safeValues[index]}`}
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 4 : 2.5}
              fill={
                index === points.length - 1
                  ? 'var(--color-brand)'
                  : 'var(--color-surface)'
              }
              stroke="var(--color-brand)"
              strokeWidth={index === points.length - 1 ? 1.5 : 1.75}
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${dates[index]}: ${formatNumber(safeValues[index])} titik panas`}</title>
            </circle>
          ))}
        </svg>

        <div className="text-ink-2 mt-[-4px] grid grid-cols-3 pr-1 pl-9 text-xs">
          <span>{dates[0]}</span>
          <span className="text-center">{dates[Math.floor((dates.length - 1) / 2)]}</span>
          <span className="text-right">{dates.at(-1)}</span>
        </div>
      </div>

      <div className="divide-line mt-4 grid grid-cols-3 divide-x">
        <TrendStat label={copy.extra.trendLatest} value={latest} />
        <TrendStat label={copy.extra.trendPeak} value={peak} />
        <TrendStat label={copy.extra.trendAverage} value={average} />
      </div>
    </section>
  )
}

function TrendStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <p className="text-ink-2 truncate text-xs">{label}</p>
      <p className="text-ink mt-1 font-mono text-sm font-semibold tabular-nums">
        {formatNumber(value)}
      </p>
    </div>
  )
}
