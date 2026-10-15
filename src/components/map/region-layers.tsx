import { useEffect, useMemo } from 'react'

import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { formatNumber } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
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

// ponytail: penanda kabupaten DOM via MarkerContent (portal ke maplibre), denyut 1.4s/2.4s.
export function RegionLayers({ regions }: RegionLayersProps) {
  const { map } = useMap()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const select = useMapStore((s) => s.select)
  const hover = useMapStore((s) => s.hover)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  // Hanya tampil saat satu provinsi dipilih dan belum masuk detail kabupaten
  const isProvinceView = province !== 'Semua' && !selectedCode

  // Bersihkan layer maplibre lama jika ada
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
        const isHovered = hoveredCode === r.code

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
                title={`${r.name}: ${copy.map.summaryMarkerNote}`}
                className={cn(
                  'border-line bg-surface text-ink rounded-ctl relative flex min-h-8 min-w-8 items-center justify-center border px-2 text-xs font-semibold tabular-nums shadow-sm transition-colors duration-150',
                  isHovered && 'border-brand text-brand z-20',
                )}
                onMouseEnter={() => hover(r.code)}
                onMouseLeave={() => hover(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  select(r.code, r.province)
                  if (!panelOpen) setPanelOpen(true)
                }}
              >
                {formatNumber(r.hotspots_24h)}
              </button>

              {isHovered ? (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
                  <MapInfoCard
                    title={r.name}
                    subtitle={RISK_CATEGORIES[risk].label}
                    meta={`${formatNumber(r.hotspots_24h)} titik panas · 24 jam`}
                    lines={[copy.map.summaryMarkerNote]}
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
