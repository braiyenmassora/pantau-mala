import { useEffect, useMemo } from 'react'

import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { formatDateDotTime, formatNumber } from '@/lib/format'
import { hasHotspotDetections, hotspotDotColor } from '@/lib/hotspot-status'
import { pinPulseStyle } from '@/lib/map-beat'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const OLD_SOURCE_ID = 'province-regencies-source'
const OLD_CIRCLE_LAYER = 'province-regencies-circle'
const OLD_LABEL_LAYER = 'province-regencies-label'

type RegionLayersProps = {
  regions: Region[]
}

/** Penanda kabupaten — riak soft dari tepi untuk semua kategori. */
export function RegionLayers({ regions }: RegionLayersProps) {
  const { map } = useMap()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const select = useMapStore((s) => s.select)
  const hover = useMapStore((s) => s.hover)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  const isProvinceView = province !== 'Semua' && !selectedCode

  useEffect(() => {
    if (!map) return
    try {
      if (map.getLayer(OLD_LABEL_LAYER)) map.removeLayer(OLD_LABEL_LAYER)
      if (map.getLayer(OLD_CIRCLE_LAYER)) map.removeLayer(OLD_CIRCLE_LAYER)
      if (map.getSource(OLD_SOURCE_ID)) map.removeSource(OLD_SOURCE_ID)
    } catch {
      // noop
    }
  }, [map])

  const provRegions = useMemo(() => {
    if (!isProvinceView) return []
    return regions.filter((r) => r.province === province)
  }, [isProvinceView, regions, province])

  if (!isProvinceView) return null

  return (
    <>
      {provRegions.map((r) => {
        const coord = r.label_point ?? r.center
        if (
          !Array.isArray(coord) ||
          coord.length < 2 ||
          !Number.isFinite(coord[0]) ||
          !Number.isFinite(coord[1])
        ) {
          return null
        }

        const risk = effectiveRiskCategory(r)
        const hasDetections = hasHotspotDetections(r.hotspots_24h)
        const isAccent = hasDetections && (risk === 'sangat_tinggi' || risk === 'sedang')
        const isHovered = hoveredCode === r.code
        const dot = hotspotDotColor(r)

        return (
          <MapMarker
            key={r.code}
            longitude={coord[0]}
            latitude={coord[1]}
            anchor="center"
          >
            <MarkerContent className="relative flex items-center justify-center overflow-visible">
              <button
                type="button"
                aria-label={r.name}
                className={cn(
                  'marker--interactive relative flex size-6 items-center justify-center rounded-full',
                  isHovered && 'z-20',
                )}
                onMouseEnter={() => hover(r.code)}
                onMouseLeave={() => hover(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  select(r.code, r.province)
                  if (!panelOpen) setPanelOpen(true)
                }}
              >
                <span
                  className={cn(
                    'border-surface rounded-full',
                    isAccent
                      ? 'marker--pulse size-4 border-2'
                      : 'size-2.5 border-[1.5px]',
                  )}
                  style={{
                    backgroundColor: dot,
                    ...(isAccent ? pinPulseStyle(risk, dot) : undefined),
                  }}
                  aria-hidden
                />
              </button>

              {isHovered ? (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
                  <MapInfoCard
                    title={r.name}
                    meta={
                      hasDetections
                        ? copy.map.regionMetaHotspots(formatNumber(r.hotspots_24h))
                        : copy.status.noDetections
                    }
                    updatedAt={
                      r.last_detection?.time
                        ? formatDateDotTime(r.last_detection.time, r.time_zone)
                        : undefined
                    }
                  />
                </div>
              ) : null}
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
