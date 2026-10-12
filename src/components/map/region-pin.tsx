import { forwardRef, useState, type ButtonHTMLAttributes } from 'react'

import { RiskMarker } from '@/components/common/risk-marker'
import { focusRing } from '@/components/common/focus-ring'
import { DetectionFlag } from '@/components/map/detection-flag'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { haloDiameter, shouldShowHalo, showHaloPulse } from '@/lib/halo'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { PIN_ACTIVE_BOX_SHADOW, RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionPinProps = {
  region: Region
}

const ACTIVE_PIN: Record<Exclude<RiskCategory, 'rendah'>, string> = {
  sangat_tinggi: 'scale-110',
  sedang: 'scale-110',
  tidak_tersedia: '',
}

/** 10px risk-low map dot (not RiskMarker). */
const LowMapDot = forwardRef<
  HTMLButtonElement,
  {
    active: boolean
    label: string
  } & ButtonHTMLAttributes<HTMLButtonElement>
>(function LowMapDot({ active, label, className, style, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'border-surface bg-risk-low shadow-map relative size-2.5 rounded-full border-2',
        'origin-center transition-[transform,box-shadow] duration-150 ease-in-out',
        focusRing,
        active && 'scale-[1.2]',
        className,
      )}
      style={{
        ...(active ? { boxShadow: PIN_ACTIVE_BOX_SHADOW } : undefined),
        ...style,
      }}
      aria-label={label}
      {...props}
    />
  )
})

export function RegionPin({ region }: RegionPinProps) {
  const { map } = useMap()
  const reducedMotion = usePrefersReducedMotion()
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const select = useMapStore((s) => s.select)
  const hover = useMapStore((s) => s.hover)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const [tipOpen, setTipOpen] = useState(false)

  const style = RISK_CATEGORIES[region.risk_category]
  const selected = selectedCode === region.code
  const active = selected || hoveredCode === region.code
  const isLow = region.risk_category === 'rendah'
  const circle = shouldShowHalo(region.hotspots_24h)
  const haloSize = haloDiameter(region.hotspots_24h)
  const pulse = !reducedMotion && !isLow && showHaloPulse(region.risk_category)
  const pulseSize = circle ? haloSize : 36
  const pulseClass =
    region.risk_category === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'
  const hotspotLabel = formatNumber(region.hotspots_24h)
  const label = copy.map.pinAria(region.name, style.label, hotspotLabel)

  const onSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    rememberFocusTrigger(e.currentTarget)
    select(region.code)
    if (!panelOpen) setPanelOpen(true)
    map?.flyTo({
      center: region.center,
      zoom: PLACE_ZOOM,
      padding: getMapPadding(true),
      duration: reducedMotion ? 0 : 600,
    })
  }

  return (
    <MapMarker
      longitude={region.center[0]}
      latitude={region.center[1]}
      anchor="center"
      onMouseEnter={() => hover(region.code)}
      onMouseLeave={() => hover(null)}
    >
      <MarkerContent
        className={cn(
          'relative flex items-center justify-center',
          active ? 'z-20' : 'z-10',
        )}
      >
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

        {selected && <DetectionFlag region={region} />}

        <Tooltip
          delayDuration={150}
          open={selected ? false : tipOpen}
          onOpenChange={(open) => {
            if (!selected) setTipOpen(open)
          }}
        >
          <TooltipTrigger asChild>
            {isLow ? (
              <LowMapDot active={active} label={label} onClick={onSelect} />
            ) : (
              <button
                type="button"
                className={cn(
                  'relative origin-center rounded-full',
                  'transition-[transform,box-shadow] duration-150 ease-in-out',
                  focusRing,
                  active &&
                    ACTIVE_PIN[region.risk_category as 'sangat_tinggi' | 'sedang'],
                )}
                style={active ? { boxShadow: PIN_ACTIVE_BOX_SHADOW } : undefined}
                aria-label={label}
                onClick={onSelect}
              >
                <RiskMarker kategori={region.risk_category} shadow active={active} />
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="rounded-ctl bg-ink text-surface px-2 py-1 text-xs"
          >
            {region.name}
          </TooltipContent>
        </Tooltip>
      </MarkerContent>
    </MapMarker>
  )
}
