import { focusRing } from '@/components/common/focus-ring'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { hasHotspotDetections, hotspotDotColor } from '@/lib/hotspot-status'
import { fitProvinceBounds } from '@/lib/indonesia-view'
import { pinPulseStyle } from '@/lib/map-beat'
import type { ProvinceAggregate } from '@/lib/province-aggregates'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvincePinProps = {
  aggregate: ProvinceAggregate
}

/** Pin provinsi — klik buka panel; tanpa tip hover. */
export function ProvincePin({ aggregate }: ProvincePinProps) {
  const { map } = useMap()
  const setProvince = useMapStore((s) => s.setProvince)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  const risk = effectiveRiskCategory(aggregate)
  const hasDetections = hasHotspotDetections(aggregate.hotspots_24h)
  const isAccent = hasDetections && (risk === 'sangat_tinggi' || risk === 'sedang')
  const dot = hotspotDotColor(aggregate)

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
          )}
          style={{
            backgroundColor: dot,
            ...(isAccent ? pinPulseStyle(risk, dot) : undefined),
          }}
          onClick={(e) => {
            e.stopPropagation()
            setProvince(aggregate.name)
            setPanelOpen(true)
            if (map) {
              fitProvinceBounds(map, aggregate.bbox, true, 0)
            }
          }}
        />
      </MarkerContent>
    </MapMarker>
  )
}
