import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { RiskMarker } from '@/components/common/risk-marker'
import { focusRing } from '@/components/common/focus-ring'
import { DetectionFlag } from '@/components/map/detection-flag'
import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatDateDotTime, formatNumber } from '@/lib/format'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { hasHotspotDetections, hotspotPinAria } from '@/lib/hotspot-status'
import { pinPulseStyle } from '@/lib/map-beat'
import { PIN_ACTIVE_BOX_SHADOW, RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionPinProps = {
  region: Region
}

const ACTIVE_PIN: Record<
  Exclude<RiskCategory, 'rendah' | 'tanpa_titik'>,
  string
> = {
  sangat_tinggi: 'scale-110',
  sedang: 'scale-110',
  tidak_tersedia: '',
}

/** Titik kecil: hijau hanya bila ada deteksi + risiko rendah; abu bila nol titik. */
const SmallMapDot = forwardRef<
  HTMLButtonElement,
  {
    active: boolean
    label: string
    /** Nol titik: netral, bukan hijau aman. */
    neutral?: boolean
    beatCategory: RiskCategory
    beatColor: string
  } & ButtonHTMLAttributes<HTMLButtonElement>
>(function SmallMapDot(
  { active, label, neutral, beatCategory, beatColor, className, style, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'marker--interactive marker--pulse border-surface shadow-map relative size-2.5 rounded-full border-2',
        neutral ? 'bg-ink-3' : 'bg-risk-low',
        focusRing,
        active && 'scale-[1.2]',
        className,
      )}
      style={{
        ...(active ? { boxShadow: PIN_ACTIVE_BOX_SHADOW } : undefined),
        ...pinPulseStyle(beatCategory, beatColor),
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
  const noDetections = !hasHotspotDetections(region.hotspots_24h)
  const isLow = !noDetections && hotspotRisk === 'rendah'
  const useSmallDot = noDetections || isLow
  const hotspotLabel = formatNumber(region.hotspots_24h)
  const label = hotspotPinAria(
    region.name,
    region.hotspots_24h,
    style.label,
    hotspotLabel,
  )
  const pulseStyle = reducedMotion ? undefined : pinPulseStyle(hotspotRisk, style.dot)

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
        {selected ? <DetectionFlag region={region} /> : null}

        {!selected && hoveredCode === region.code ? (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
            <MapInfoCard
              title={region.name}
              meta={
                noDetections
                  ? copy.status.noDetections
                  : copy.map.regionMetaHotspots(formatNumber(region.hotspots_24h))
              }
              updatedAt={
                region.last_detection?.time
                  ? formatDateDotTime(region.last_detection.time, region.time_zone)
                  : undefined
              }
            />
          </div>
        ) : null}

        {useSmallDot ? (
          <SmallMapDot
            active={active}
            label={label}
            neutral={noDetections}
            beatCategory={hotspotRisk}
            beatColor={style.dot}
            onClick={onSelect}
          />
        ) : (
          <button
            type="button"
            className={cn(
              'marker--interactive marker--pulse relative origin-center rounded-full',
              focusRing,
              active && ACTIVE_PIN[hotspotRisk as 'sangat_tinggi' | 'sedang'],
            )}
            style={{
              ...(active ? { boxShadow: PIN_ACTIVE_BOX_SHADOW } : undefined),
              ...pulseStyle,
            }}
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
