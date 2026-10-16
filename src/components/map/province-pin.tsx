import { focusRing } from '@/components/common/focus-ring'
import { RiskMarker } from '@/components/common/risk-marker'
import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'
import { showHaloPulse } from '@/lib/halo'
import { fitProvinceBounds } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import type { ProvinceAggregate } from '@/lib/province-aggregates'
import { withAlpha, RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvincePinProps = {
  aggregate: ProvinceAggregate
  hovered?: boolean
  onHover?: (name: string | null) => void
}

/** Pin nasional: titik warna + halo lembut (seperti overview). */
export function ProvincePin({ aggregate, hovered = false, onHover }: ProvincePinProps) {
  const { map } = useMap()
  const setProvince = useMapStore((s) => s.setProvince)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()

  const risk = effectiveRiskCategory(aggregate)
  const style = RISK_CATEGORIES[risk]
  const pulse = !reducedMotion && showHaloPulse(risk, aggregate.hotspots_24h)
  const pulseClass = risk === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'

  return (
    <MapMarker
      longitude={aggregate.center[0]}
      latitude={aggregate.center[1]}
      anchor="center"
    >
      <MarkerContent
        className={cn(
          'relative z-10 flex items-center justify-center overflow-visible',
          hovered && 'z-20',
        )}
      >
        {pulse ? (
          <span
            aria-hidden
            data-testid="province-pin-halo"
            className={cn(
              'pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
              pulseClass,
            )}
            style={{ borderColor: withAlpha(style.dot, 0.5) }}
          />
        ) : null}

        <button
          type="button"
          aria-label={aggregate.name}
          className={cn(
            'marker--interactive relative origin-center rounded-full',
            focusRing,
          )}
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
        >
          <RiskMarker kategori={risk} shadow active className="size-3.5" />
        </button>

        {hovered ? (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
            <MapInfoCard
              title={aggregate.name}
              subtitle={style.label}
              meta={copy.map.regionMetaHotspots(formatNumber(aggregate.hotspots_24h))}
            />
          </div>
        ) : null}
      </MarkerContent>
    </MapMarker>
  )
}
