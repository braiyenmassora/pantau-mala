import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { Sparkline } from '@/components/common/sparkline'
import type { MapRef } from '@/components/ui/map'
import { getCopy } from '@/copy'
import type { Region } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { hasHotspotDetections } from '@/lib/hotspot-status'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionRowProps = {
  region: Region
  mapRef: RefObject<MapRef | null>
}

/** Baris kab/kota — pola sama daftar provinsi beranda: dot · nama · spark · mono. */
export function RegionRow({ region, mapRef }: RegionRowProps) {
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hover = useMapStore((s) => s.hover)
  const select = useMapStore((s) => s.select)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const active = hoveredCode === region.code || selectedCode === region.code
  const risk = effectiveRiskCategory(region)
  const hasDetections = hasHotspotDetections(region.hotspots_24h)
  const meta = RISK_CATEGORIES[risk]
  const trend = region.trend_7d

  return (
    <button
      type="button"
      className={cn(
        'rounded-ctl flex w-full items-center gap-3 px-2 py-3 text-left',
        'transition-colors duration-150',
        active ? 'bg-surface-muted' : 'hover:bg-surface-muted',
        focusRing,
      )}
      onMouseEnter={() => hover(region.code)}
      onMouseLeave={() => hover(null)}
      onClick={(e) => {
        rememberFocusTrigger(e.currentTarget)
        select(region.code, region.province)
        setPanelOpen(true)
        mapRef.current?.flyTo({
          center: region.center,
          zoom: PLACE_ZOOM,
          padding: getMapPadding(true),
          duration: reducedMotion ? 0 : 600,
        })
      }}
    >
      <span className={cn('size-2 shrink-0 rounded-full', meta.dotClass)} aria-hidden />
      <span
        className="text-ink min-w-0 flex-1 truncate text-sm leading-5 font-medium"
        title={region.name}
      >
        {region.name}
      </span>
      {trend && trend.length >= 2 ? (
        <Sparkline
          data={trend}
          width={48}
          height={18}
          className={
            !hasDetections
              ? 'text-ink-3'
              : risk === 'sangat_tinggi'
                ? 'text-risk-high'
                : risk === 'sedang'
                  ? 'text-risk-mid'
                  : 'text-risk-low'
          }
          ariaLabel={`${getCopy().extra.trendChart} ${region.name}`}
        />
      ) : null}
      <span className="text-ink shrink-0 font-mono text-sm leading-5 font-semibold tabular-nums">
        {formatNumber(region.hotspots_24h)}
      </span>
    </button>
  )
}
