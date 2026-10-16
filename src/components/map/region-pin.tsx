import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { RiskMarker } from '@/components/common/risk-marker'
import { focusRing } from '@/components/common/focus-ring'
import { DetectionFlag } from '@/components/map/detection-flag'
import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { showHaloPulse } from '@/lib/halo'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { PIN_ACTIVE_BOX_SHADOW, RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
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
        'marker--interactive border-surface bg-risk-low shadow-map relative size-2.5 rounded-full border-2',
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

  const hotspotRisk = effectiveRiskCategory(region)
  const style = RISK_CATEGORIES[hotspotRisk]
  const selected = selectedCode === region.code
  const active = selected || hoveredCode === region.code
  const isLow = hotspotRisk === 'rendah'
  const pulse =
    !reducedMotion && !isLow && showHaloPulse(hotspotRisk, region.hotspots_24h)
  const pulseClass =
    hotspotRisk === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'
  const hotspotLabel = formatNumber(region.hotspots_24h)
  const label = copy.map.pinAria(region.name, style.label, hotspotLabel)

  const onSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    rememberFocusTrigger(e.currentTarget)
    select(region.code)
    if (!panelOpen) setPanelOpen(true)
    if (!map) return
    map.setMaxBounds(null)
    map.stop()
    map.flyTo({
      center: region.center,
      zoom: PLACE_ZOOM,
      padding: getMapPadding(true),
      duration: 0,
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
          'relative flex items-center justify-center overflow-visible',
          active ? 'z-20' : 'z-10',
        )}
      >
        {pulse && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
              pulseClass,
            )}
            style={{ borderColor: withAlpha(style.dot, 0.55) }}
          />
        )}

        {selected ? <DetectionFlag region={region} /> : null}

        {!selected && hoveredCode === region.code ? (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
            <MapInfoCard
              title={region.name}
              subtitle={copy.map.regionMetaProvince(region.province)}
              meta={copy.map.regionPinDetails(hotspotLabel, style.label)}
            />
          </div>
        ) : null}

        {isLow ? (
          <LowMapDot active={active} label={label} onClick={onSelect} />
        ) : (
          <button
            type="button"
            className={cn(
              'marker--interactive relative origin-center rounded-full',
              focusRing,
              active && ACTIVE_PIN[hotspotRisk as 'sangat_tinggi' | 'sedang'],
            )}
            style={active ? { boxShadow: PIN_ACTIVE_BOX_SHADOW } : undefined}
            aria-label={label}
            onClick={onSelect}
          >
            <RiskMarker kategori={hotspotRisk} shadow active={active} />
          </button>
        )}
      </MarkerContent>
    </MapMarker>
  )
}
