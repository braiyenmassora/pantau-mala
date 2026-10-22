import { focusRing } from '@/components/common/focus-ring'
import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { getCopy } from '@/copy'
import { useMeta } from '@/data/queries'
import { formatDateDotTime, formatNumber } from '@/lib/format'
import { fitProvinceBounds } from '@/lib/indonesia-view'
import type { ProvinceAggregate } from '@/lib/province-aggregates'
import { hasHotspotDetections, hotspotDotColor } from '@/lib/hotspot-status'
import { pinPulseStyle } from '@/lib/map-beat'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvincePinProps = {
  aggregate: ProvinceAggregate
  hovered?: boolean
  onHover?: (name: string | null) => void
}

/** Pin provinsi — riak soft dari tepi untuk semua kategori risiko. */
export function ProvincePin({ aggregate, hovered = false, onHover }: ProvincePinProps) {
  const { map } = useMap()
  const setProvince = useMapStore((s) => s.setProvince)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  const { data: meta } = useMeta()
  const risk = effectiveRiskCategory(aggregate)
  const hasDetections = hasHotspotDetections(aggregate.hotspots_24h)
  const isAccent = hasDetections && (risk === 'sangat_tinggi' || risk === 'sedang')
  const dot = hotspotDotColor(aggregate)
  const firmsAt = meta?.pulled_at.firms ?? meta?.updated_at
  const updatedAt = firmsAt ? formatDateDotTime(firmsAt, 'WIB') : undefined

  return (
    <MapMarker
      longitude={aggregate.center[0]}
      latitude={aggregate.center[1]}
      anchor="center"
    >
      <MarkerContent className="relative z-10 flex items-center justify-center overflow-visible">
        <button
          type="button"
          aria-label={aggregate.name}
          className={cn(
            'marker--interactive border-surface relative rounded-full',
            focusRing,
            isAccent ? 'marker--pulse size-4 border-2' : 'size-2.5 border-[1.5px]',
            hovered && 'z-20',
          )}
          style={{
            backgroundColor: dot,
            ...(isAccent ? pinPulseStyle(risk, dot) : undefined),
          }}
          onMouseEnter={() => onHover?.(aggregate.name)}
          onMouseLeave={() => onHover?.(null)}
          onClick={(e) => {
            e.stopPropagation()
            setProvince(aggregate.name)
            if (!panelOpen) setPanelOpen(true)
            if (map) {
              fitProvinceBounds(map, aggregate.bbox, true, 0)
            }
          }}
        />

        {hovered ? (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
            <MapInfoCard
              title={aggregate.name}
              meta={
                hasDetections
                  ? getCopy().map.regionMetaHotspots(formatNumber(aggregate.hotspots_24h))
                  : getCopy().status.noDetections
              }
              updatedAt={updatedAt}
            />
          </div>
        ) : null}
      </MarkerContent>
    </MapMarker>
  )
}
