import { useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { RiskMarker } from '@/components/common/risk-marker'
import { MapMarker, MarkerContent } from '@/components/ui/map'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'
import { haloDiameter, shouldShowHalo, showHaloPulse } from '@/lib/halo'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import type { ProvinceAggregate } from '@/lib/province-aggregates'
import { PIN_ACTIVE_BOX_SHADOW, RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvincePinProps = {
  aggregate: ProvinceAggregate
}

/** Pin provinsi: RiskMarker + badge total + lingkaran ukuran. */
export function ProvincePin({ aggregate }: ProvincePinProps) {
  const setProvince = useMapStore((s) => s.setProvince)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const [tipOpen, setTipOpen] = useState(false)

  const style = RISK_CATEGORIES[aggregate.risk_category]
  const circle = shouldShowHalo(aggregate.hotspots_24h)
  const haloSize = haloDiameter(aggregate.hotspots_24h)
  // Denyut dari total agregat (bukan per kab) — sedang/sangat_tinggi.
  const pulse = !reducedMotion && showHaloPulse(aggregate.risk_category)
  const pulseSize = circle ? haloSize : 36
  const pulseClass =
    aggregate.risk_category === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'
  const countLabel = formatNumber(aggregate.hotspots_24h)
  const label = copy.map.pinAria(aggregate.name, style.label, countLabel)

  return (
    <MapMarker
      longitude={aggregate.center[0]}
      latitude={aggregate.center[1]}
      anchor="center"
    >
      <MarkerContent className="relative z-10 flex items-center justify-center">
        {circle && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              width: haloSize,
              height: haloSize,
              backgroundColor: withAlpha(style.dot, 0.1),
              borderColor: withAlpha(style.dot, 0.24),
            }}
          />
        )}
        {pulse && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-1/2 left-1/2 rounded-full border-2',
              pulseClass,
            )}
            style={{
              width: pulseSize,
              height: pulseSize,
              borderColor: withAlpha(style.dot, 0.55),
            }}
          />
        )}

        <Tooltip delayDuration={150} open={tipOpen} onOpenChange={setTipOpen}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'relative origin-center rounded-full',
                'transition-[transform,box-shadow] duration-150 ease-in-out',
                'hover:scale-110',
                focusRing,
              )}
              style={{ boxShadow: PIN_ACTIVE_BOX_SHADOW }}
              aria-label={label}
              onClick={(e) => {
                e.stopPropagation()
                // Zoom via ProvinceFocus; angka sudah di badge ikon.
                setProvince(aggregate.name)
                if (!panelOpen) setPanelOpen(true)
              }}
            >
              <RiskMarker kategori={aggregate.risk_category} shadow active />
              <span
                aria-hidden
                className="bg-ink text-surface absolute -top-1 -right-2 min-w-5 rounded-full px-1 text-center text-xs leading-4 font-semibold tabular-nums shadow-sm"
              >
                {countLabel}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="rounded-ctl bg-ink text-surface px-2 py-1 text-xs"
          >
            {aggregate.name}
          </TooltipContent>
        </Tooltip>
      </MarkerContent>
    </MapMarker>
  )
}
