import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { RiskMarker } from '@/components/common/risk-marker'
import { Sparkline } from '@/components/common/sparkline'
import { Card, CardContent } from '@/components/ui/card'
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

/** Baris kabupaten sebagai kartu hasil — sama pola dengan daftar provinsi. */
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
    <Card
      className={cn(
        'transition-colors duration-150',
        active ? 'bg-surface-muted' : 'hover:bg-surface-muted',
      )}
    >
      <button
        type="button"
        className={cn('flex w-full items-center gap-3 text-left', focusRing, 'rounded-card')}
        onMouseEnter={() => hover(region.code)}
        onMouseLeave={() => hover(null)}
        onClick={(e) => {
          rememberFocusTrigger(e.currentTarget)
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
        <CardContent className="flex w-full items-center gap-3 py-3">
          <RiskMarker kategori={region.risk_category} />
          <span
            className="text-ink min-w-0 flex-1 truncate text-sm font-medium leading-5"
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
          <span className="text-ink shrink-0 text-sm font-semibold tabular-nums leading-5">
            {formatNumber(region.hotspots_24h)}
          </span>
        </CardContent>
      </button>
    </Card>
  )
}
