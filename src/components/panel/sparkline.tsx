type SparklineProps = {
  values: number[]
  width: number
  height: number
  color: string
  className?: string
  /** Draw a baseline along the bottom edge (detail trend chart). */
  showBaseline?: boolean
}

export function Sparkline({
  values,
  width,
  height,
  color,
  className,
  showBaseline = false,
}: SparklineProps) {
  if (values.length < 2) return null

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = Math.max(max - min, 1)
  const pad = 2
  const baselineY = height - pad

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2)
      const y = height - pad - ((v - min) / span) * (height - pad * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      {showBaseline && (
        <line
          x1={pad}
          y1={baselineY}
          x2={width - pad}
          y2={baselineY}
          stroke="#E3E9E4"
          strokeWidth={1}
        />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}
