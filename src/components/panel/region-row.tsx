import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { RiskMarker } from '@/components/common/risk-marker'
import { Sparkline } from '@/components/common/sparkline'
import type { MapRef } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionRowProps = {
  region: Region
  mapRef: RefObject<MapRef | null>
}

export function RegionRow({ region, mapRef }: RegionRowProps) {
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hover = useMapStore((s) => s.hover)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const active = hoveredCode === region.code || selectedCode === region.code

  return (
    <button
      type="button"
      className={cn(
        'flex min-h-10 w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 max-sm:min-h-11',
        active ? 'bg-surface-muted' : 'hover:bg-surface-muted',
        focusRing,
        'focus-visible:ring-offset-0 focus-visible:ring-inset',
      )}
      onMouseEnter={() => hover(region.code)}
      onMouseLeave={() => hover(null)}
      onClick={(event) => {
        rememberFocusTrigger(event.currentTarget)
        select(region.code, region.province)
        if (!panelOpen) setPanelOpen(true)
        mapRef.current?.flyTo({
          center: region.center,
          zoom: PLACE_ZOOM,
          padding: getMapPadding(true),
          duration: reducedMotion ? 0 : 600,
        })
      }}
    >
      <RiskMarker kategori={region.risk_category} />
      <span
        className="text-ink min-w-0 flex-1 truncate text-sm leading-5 font-medium"
        title={region.name}
      >
        {region.name}
      </span>
      <Sparkline
        data={region.trend_7d}
        height={16}
        width={40}
        className="shrink-0 opacity-40"
      />
      <span className="text-ink shrink-0 text-sm leading-5 font-semibold tabular-nums">
        {formatNumber(region.hotspots_24h)}
      </span>
    </button>
  )
}
