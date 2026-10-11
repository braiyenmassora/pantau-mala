import { useCallback, useMemo } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { useHotspots } from '@/data/queries'
import type { Region } from '@/data/types'
import { filterHotspotsForMap } from '@/lib/filter-hotspots-for-map'
import { showHaloPulse } from '@/lib/halo'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type SelectedHotspotsLayerProps = {
  regions: Region[]
}

/** Marker DOM hanya jika titik sedikit. Kab padat → heatmap saja (tanpa angka cluster). */
const DOM_MARKER_MAX = 64

/**
 * Titik klikable + beat bila sedikit.
 * Banyak titik (Merauke dll): biarkan HotspotHeatmapLayer — tanpa bubble angka.
 */
export function SelectedHotspotsLayer({ regions }: SelectedHotspotsLayerProps) {
  const { map } = useMap()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data } = useHotspots()
  const reducedMotion = usePrefersReducedMotion()

  const regionByCode = useMemo(() => {
    const m = new Map<string, Region>()
    for (const r of regions) m.set(r.code, r)
    return m
  }, [regions])

  const collection = useMemo(
    () => filterHotspotsForMap(data, regions, province, selectedCode),
    [data, regions, province, selectedCode],
  )

  const selectKab = useCallback(
    (code: string) => {
      const region = regionByCode.get(code)
      select(code)
      if (!panelOpen) setPanelOpen(true)
      if (region && map) {
        map.flyTo({
          center: region.center,
          zoom: PLACE_ZOOM,
          padding: getMapPadding(true),
          duration: reducedMotion ? 0 : 600,
        })
      }
    },
    [map, panelOpen, reducedMotion, regionByCode, select, setPanelOpen],
  )

  // Padat: heatmap handle visual; pin kab + flag dari RegionLayers.
  if (collection.features.length === 0 || collection.features.length > DOM_MARKER_MAX) {
    return null
  }

  return (
    <>
      {collection.features.map((f, i) => {
        const [lon, lat] = f.geometry.coordinates
        const code = f.properties.region_code!
        const region = regionByCode.get(code)
        const risk = region?.risk_category ?? 'sedang'
        const style = RISK_CATEGORIES[risk]
        const pulse = !reducedMotion && showHaloPulse(risk)
        const pulseClass =
          risk === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'
        const active = selectedCode === code

        return (
          <MapMarker
            key={`${f.properties.time}-${lon}-${lat}-${i}`}
            longitude={lon}
            latitude={lat}
            anchor="center"
          >
            <MarkerContent
              className={cn(
                'relative flex items-center justify-center',
                active ? 'z-20' : 'z-15',
              )}
            >
              {pulse && (
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute top-1/2 left-1/2 size-3.5 rounded-full border-2',
                    pulseClass,
                  )}
                  style={{ borderColor: withAlpha(style.dot, 0.65) }}
                />
              )}
              <button
                type="button"
                className={cn(
                  'border-surface shadow-map relative size-2.5 rounded-full border-2',
                  focusRing,
                  active && 'scale-125',
                )}
                style={{ backgroundColor: style.dot }}
                aria-label={region ? `${region.name}, ${style.label}` : style.label}
                onClick={(e) => {
                  e.stopPropagation()
                  selectKab(code)
                }}
              />
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
