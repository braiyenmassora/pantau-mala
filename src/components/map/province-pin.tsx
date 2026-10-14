import { useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { RiskMarker } from '@/components/common/risk-marker'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { mapPinTip } from '@/components/map/map-pin-tip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'
import { showHaloPulse } from '@/lib/halo'
import { fitProvinceBounds } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import type { ProvinceAggregate } from '@/lib/province-aggregates'
import { PIN_ACTIVE_BOX_SHADOW, RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvincePinProps = {
  aggregate: ProvinceAggregate
}

/** Pin provinsi: satu lingkaran penuh + beat pulse (angka ada di list panel). */
export function ProvincePin({ aggregate }: ProvincePinProps) {
  const { map } = useMap()
  const setProvince = useMapStore((s) => s.setProvince)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const [tipOpen, setTipOpen] = useState(false)

  const hotspotRisk = effectiveRiskCategory(aggregate)
  const style = RISK_CATEGORIES[hotspotRisk]
  const pulse = !reducedMotion && showHaloPulse(hotspotRisk, aggregate.hotspots_24h)
  const pulseClass =
    hotspotRisk === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'
  const label = copy.map.pinAria(
    aggregate.name,
    style.label,
    formatNumber(aggregate.hotspots_24h),
  )

  return (
    <MapMarker
      longitude={aggregate.center[0]}
      latitude={aggregate.center[1]}
      anchor="center"
    >
      <MarkerContent className="relative z-10 flex items-center justify-center overflow-visible">
        {pulse && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
              pulseClass,
            )}
            style={{ borderColor: withAlpha(style.dot, 0.5) }}
          />
        )}

        <Tooltip delayDuration={150} open={tipOpen} onOpenChange={setTipOpen}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn('relative origin-center rounded-full', focusRing)}
              style={{ boxShadow: PIN_ACTIVE_BOX_SHADOW }}
              aria-label={label}
              onClick={(e) => {
                e.stopPropagation()
                setProvince(aggregate.name)
                if (!panelOpen) setPanelOpen(true)
                if (map) {
                  fitProvinceBounds(map, aggregate.bbox, true, 0)
                }
              }}
            >
              <RiskMarker kategori={hotspotRisk} shadow active className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8} className={mapPinTip}>
            <span className="text-ink font-semibold">
              {copy.map.provincePinTitle(aggregate.name)}
            </span>
          </TooltipContent>
        </Tooltip>
      </MarkerContent>
    </MapMarker>
  )
}
