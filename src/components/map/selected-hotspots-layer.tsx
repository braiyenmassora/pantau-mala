import circle from '@turf/circle'
import distance from '@turf/distance'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FeatureCollection, Polygon } from 'geojson'
import type { GeoJSONSource } from 'maplibre-gl'

import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useHotspots } from '@/data/queries'
import type { Region } from '@/data/types'
import { formatDateTime, formatNumber } from '@/lib/format'
import { getMapPadding } from '@/lib/indonesia-view'
import { MAP_COLORS } from '@/lib/map-colors'
import { HOTSPOT_HEX } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const MASK_SOURCE_ID = 'selected-region-mask-source'
const MASK_FILL_LAYER = 'selected-region-mask-fill'

type SelectedHotspotsLayerProps = {
  regions: Region[]
}

// ponytail: fit-bounds sekali per kabupaten; mask setData tanpa removeLayer tiap update.
export function SelectedHotspotsLayer({ regions }: SelectedHotspotsLayerProps) {
  const { map, isLoaded } = useMap()
  const selectedCode = useMapStore((s) => s.selectedCode)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const { data } = useHotspots(Boolean(selectedCode))
  const lastFitCode = useRef<string | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  const selectedRegion = useMemo(
    () => regions.find((r) => r.code === selectedCode),
    [regions, selectedCode],
  )

  const regionHotspots = useMemo(() => {
    if (!selectedCode || !data) return []
    return data.features.filter((f) => f.properties.region_code === selectedCode)
  }, [selectedCode, data])

  const focus = useMemo(() => {
    if (!selectedRegion) return null
    let minLon = selectedRegion.center[0]
    let maxLon = selectedRegion.center[0]
    let minLat = selectedRegion.center[1]
    let maxLat = selectedRegion.center[1]

    for (const f of regionHotspots) {
      const [lon, lat] = f.geometry.coordinates
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }

    const pad = 0.12
    const bounds = {
      minLon: minLon - pad,
      maxLon: maxLon + pad,
      minLat: minLat - pad,
      maxLat: maxLat + pad,
    }
    const center: [number, number] = [
      (bounds.minLon + bounds.maxLon) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ]
    const radiusKm = Math.max(
      distance(center, [bounds.minLon, bounds.minLat], { units: 'kilometers' }),
      distance(center, [bounds.maxLon, bounds.minLat], { units: 'kilometers' }),
      distance(center, [bounds.maxLon, bounds.maxLat], { units: 'kilometers' }),
      distance(center, [bounds.minLon, bounds.maxLat], { units: 'kilometers' }),
    )
    return { bounds, center, radiusKm }
  }, [selectedRegion, regionHotspots])

  // Fit bounds hanya saat ganti kabupaten terpilih
  useEffect(() => {
    if (!map || !focus || !selectedCode) {
      lastFitCode.current = null
      return
    }
    if (lastFitCode.current === selectedCode) return
    lastFitCode.current = selectedCode
    map.fitBounds(
      [
        [focus.bounds.minLon, focus.bounds.minLat],
        [focus.bounds.maxLon, focus.bounds.maxLat],
      ],
      {
        padding: getMapPadding(panelOpen),
        duration: 600,
        maxZoom: 11,
      },
    )
    // shortcut: panelOpen tidak di-deps — menghindari fit ulang tiap toggle panel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedCode, focus])

  // Mask: setData saja; remove hanya saat unmount / tidak ada focus
  useEffect(() => {
    if (!map || !isLoaded) return

    if (!focus) {
      try {
        if (map.getLayer(MASK_FILL_LAYER)) map.removeLayer(MASK_FILL_LAYER)
        if (map.getSource(MASK_SOURCE_ID)) map.removeSource(MASK_SOURCE_ID)
      } catch {
        // cleanup
      }
      return
    }

    const hole = circle(focus.center, focus.radiusKm, {
      units: 'kilometers',
      steps: 64,
    })
    const holeRing = hole.geometry.coordinates[0]

    const maskGeoJson: FeatureCollection<Polygon> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-180, -85],
                [180, -85],
                [180, 85],
                [-180, 85],
                [-180, -85],
              ],
              [...holeRing].reverse(),
            ],
          },
          properties: {},
        },
      ],
    }

    if (!map.getSource(MASK_SOURCE_ID)) {
      map.addSource(MASK_SOURCE_ID, {
        type: 'geojson',
        data: maskGeoJson,
      })
    } else {
      const src = map.getSource(MASK_SOURCE_ID) as GeoJSONSource | undefined
      src?.setData(maskGeoJson)
    }

    if (!map.getLayer(MASK_FILL_LAYER)) {
      map.addLayer({
        id: MASK_FILL_LAYER,
        type: 'fill',
        source: MASK_SOURCE_ID,
        paint: {
          'fill-color': MAP_COLORS.surface,
          'fill-opacity': 0.4,
        },
      })
    }
  }, [map, isLoaded, focus])

  // Teardown mask hanya saat komponen unmount
  useEffect(() => {
    if (!map) return
    return () => {
      try {
        if (map.getLayer(MASK_FILL_LAYER)) map.removeLayer(MASK_FILL_LAYER)
        if (map.getSource(MASK_SOURCE_ID)) map.removeSource(MASK_SOURCE_ID)
      } catch {
        // teardown
      }
    }
  }, [map])

  if (!selectedRegion || regionHotspots.length === 0 || regionHotspots.length > 64)
    return null

  return (
    <>
      {regionHotspots.map((f, i) => {
        const [lon, lat] = f.geometry.coordinates
        const stamp = formatDateTime(f.properties.time, selectedRegion.time_zone)
        const label = `Titik panas ${stamp} · FRP ${formatNumber(f.properties.frp_mw)} MW`

        return (
          <MapMarker
            key={`${f.properties.time}-${lon}-${lat}-${i}`}
            longitude={lon}
            latitude={lat}
            anchor="center"
          >
            <MarkerContent className="relative flex items-center justify-center overflow-visible">
              {hovered === i ? (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
                  <MapInfoCard
                    title={copy.extra.detections}
                    lines={[
                      selectedRegion.name,
                      `Terdeteksi ${stamp}`,
                      `FRP ${formatNumber(f.properties.frp_mw)} MW`,
                    ]}
                  />
                </div>
              ) : null}
              <span
                tabIndex={0}
                role="img"
                aria-label={label}
                className={cn(
                  'border-surface relative size-2.5 cursor-pointer rounded-full border-2 shadow-sm',
                  'transition-transform duration-150 hover:scale-125',
                )}
                style={{ backgroundColor: HOTSPOT_HEX }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
              />
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
