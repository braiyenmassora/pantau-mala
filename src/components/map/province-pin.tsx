import type { CSSProperties } from 'react'

import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'
import { fitProvinceBounds } from '@/lib/indonesia-view'
import type { ProvinceAggregate } from '@/lib/province-aggregates'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvincePinProps = {
  aggregate: ProvinceAggregate
  hovered?: boolean
  onHover?: (name: string | null) => void
}

// ponytail: pin provinsi beat soft tanpa angka — warna dari RISK_CATEGORIES.
export function ProvincePin({ aggregate, hovered = false, onHover }: ProvincePinProps) {
  const { map } = useMap()
  const setProvince = useMapStore((s) => s.setProvince)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  const risk = effectiveRiskCategory(aggregate)
  const isHigh = risk === 'sangat_tinggi'
  const isMid = risk === 'sedang'
  const dot = RISK_CATEGORIES[risk].dot

  const pulseStyle: CSSProperties | undefined =
    isHigh || isMid
      ? ({
          '--risk-color': dot,
          '--beat': isHigh ? '0.75s' : '1.8s',
        } as CSSProperties)
      : undefined

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
          title={`${aggregate.name}: ${copy.map.summaryMarkerNote}`}
          className={cn(
            'border-surface relative rounded-full transition-transform duration-150',
            isHigh || isMid ? 'marker--pulse size-4 border-2' : 'size-2.5 border-[1.5px]',
            hovered && 'z-20 scale-[1.3]',
          )}
          style={{ backgroundColor: dot, ...pulseStyle }}
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
              subtitle={RISK_CATEGORIES[risk].label}
              meta={`${formatNumber(aggregate.hotspots_24h)} titik panas · 24 jam`}
            />
          </div>
        ) : null}
      </MarkerContent>
    </MapMarker>
  )
}
