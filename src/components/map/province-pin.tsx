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
import type { RiskCategory } from '@/data/types'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvincePinProps = {
  aggregate: ProvinceAggregate
}

/**
 * Pin provinsi: Bullet melingkar (compact circular pin).
 * Mempertahankan footprint bulat kompak agar tidak saling menutupi pulau di peta.
 */
export function ProvincePin({ aggregate }: ProvincePinProps) {
  const setProvince = useMapStore((s) => s.setProvince)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const [tipOpen, setTipOpen] = useState(false)

  const hotspotRisk: RiskCategory =
    aggregate.risk_category !== 'tidak_tersedia'
      ? aggregate.risk_category
      : aggregate.hotspots_24h >= 20
        ? 'sangat_tinggi'
        : aggregate.hotspots_24h >= 5
          ? 'sedang'
          : 'rendah'

  const style = RISK_CATEGORIES[hotspotRisk]
  const circle = shouldShowHalo(aggregate.hotspots_24h)
  const haloSize = haloDiameter(aggregate.hotspots_24h)
  const pulse = !reducedMotion && showHaloPulse(hotspotRisk, aggregate.hotspots_24h)
  const pulseSize = circle ? haloSize : 36
  const pulseClass =
    hotspotRisk === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'
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
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-40"
            style={{
              width: haloSize,
              height: haloSize,
              borderColor: withAlpha(style.dot, 0.4),
            }}
          />
        )}
        {pulse && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-1/2 left-1/2 rounded-full border',
              pulseClass,
            )}
            style={{
              width: pulseSize,
              height: pulseSize,
              borderColor: withAlpha(style.dot, 0.6),
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
                'hover:scale-110 active:scale-95',
                focusRing,
              )}
              style={{ boxShadow: PIN_ACTIVE_BOX_SHADOW }}
              aria-label={label}
              onClick={(e) => {
                e.stopPropagation()
                setProvince(aggregate.name)
                if (!panelOpen) setPanelOpen(true)
              }}
            >
              <RiskMarker kategori={hotspotRisk} shadow active className="size-6" />
              <span
                aria-hidden
                className="border-surface bg-ink text-surface shadow-sm pointer-events-none absolute -top-1 -right-1 min-w-4 rounded-full border px-1 text-center font-mono text-xs leading-4 font-semibold tabular-nums"
              >
                {countLabel}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="rounded-card border-line/10 bg-ink text-surface z-50 flex w-60 flex-col items-start gap-1 p-2 text-xs shadow-md"
          >
            <span className="border-line/20 flex w-full items-center justify-between gap-2 border-b pb-1">
              <span className="text-surface font-medium">
                {copy.map.provincePinTitle(aggregate.name)}
              </span>
              <span className="text-surface/70 shrink-0 font-mono text-xs tabular-nums">
                {copy.map.provincePinPeriod}
              </span>
            </span>
            <span className="text-surface/90">
              {copy.map.provincePinDetails(countLabel, style.label)}
            </span>
          </TooltipContent>
        </Tooltip>
      </MarkerContent>
    </MapMarker>
  )
}
