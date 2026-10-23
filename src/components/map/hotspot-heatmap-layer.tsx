import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  GeoJSONSource,
  HeatmapLayerSpecification,
  MapLayerMouseEvent,
  MapMouseEvent,
} from 'maplibre-gl'

import { MapInfoCard } from '@/components/map/map-info-card'
import { MapPopup, useMap } from '@/components/ui/map'
import { getCopy } from '@/copy'
import { useHotspots } from '@/data/queries'
import type { Region, TimeZoneId } from '@/data/types'
import { filterHotspotsForMap } from '@/lib/filter-hotspots-for-map'
import { formatDateDotTime } from '@/lib/format'
import { MAP_COLORS } from '@/lib/map-colors'
import {
  HEATMAP_HIGH_HEX,
  HEATMAP_LOW_HEX,
  HEATMAP_MID_HEX,
  HEATMAP_TRANSPARENT,
} from '@/lib/risk-category'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const SOURCE_ID = 'fy-hotspot-heatmap'
const LAYER_ID = 'fy-hotspot-heatmap-layer'
const POINTS_LAYER_ID = 'fy-hotspot-points-layer'

/** Di bawah zoom ini heatmap di-hide. 5.5 agar fit provinsi (sering ~6–7) tetap terlihat. */
export const HEATMAP_MIN_ZOOM = 5.5

type HotspotHeatmapLayerProps = {
  regions: Region[]
}

type ActiveHotspot = {
  longitude: number
  latitude: number
  district?: string
  regency?: string
  updatedAt?: string
  pinned: boolean
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const t = value.trim()
  return t ? t : undefined
}

/** Deteksi dari timestamp UTC → "09 Okt 2026 · 14:05 WIB". */
function formatUpdatedAt(
  rawTime: string | undefined,
  zone: TimeZoneId,
): string | undefined {
  if (!rawTime) return undefined
  if (Number.isNaN(Date.parse(rawTime))) return undefined
  return formatDateDotTime(rawTime, zone)
}

const HEATMAP_PAINT = {
  'heatmap-weight': ['get', 'weight'],
  'heatmap-radius': [
    'interpolate',
    ['linear'],
    ['zoom'],
    HEATMAP_MIN_ZOOM,
    10,
    8,
    16,
    11,
    24,
  ],
  'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    HEATMAP_TRANSPARENT,
    0.2,
    HEATMAP_LOW_HEX,
    0.5,
    HEATMAP_MID_HEX,
    1,
    HEATMAP_HIGH_HEX,
  ],
  'heatmap-opacity': [
    'interpolate',
    ['linear'],
    ['zoom'],
    HEATMAP_MIN_ZOOM,
    0.7,
    10,
    0.75,
    12,
    0,
  ],
} satisfies NonNullable<HeatmapLayerSpecification['paint']>

function ensureHeatmapLayers(map: NonNullable<ReturnType<typeof useMap>['map']>) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }

  if (!map.getLayer(LAYER_ID)) {
    map.addLayer({
      id: LAYER_ID,
      type: 'heatmap',
      source: SOURCE_ID,
      minzoom: HEATMAP_MIN_ZOOM,
      paint: HEATMAP_PAINT,
    })
  } else {
    map.setPaintProperty(LAYER_ID, 'heatmap-color', HEATMAP_PAINT['heatmap-color'])
    map.setPaintProperty(LAYER_ID, 'heatmap-opacity', HEATMAP_PAINT['heatmap-opacity'])
    map.setPaintProperty(LAYER_ID, 'heatmap-radius', HEATMAP_PAINT['heatmap-radius'])
    map.setPaintProperty(LAYER_ID, 'heatmap-weight', HEATMAP_PAINT['heatmap-weight'])
    map.setLayerZoomRange(LAYER_ID, HEATMAP_MIN_ZOOM, 24)
  }

  if (!map.getLayer(POINTS_LAYER_ID)) {
    map.addLayer({
      id: POINTS_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      minzoom: 10,
      paint: {
        'circle-radius': 3.5,
        'circle-color': HEATMAP_HIGH_HEX,
        'circle-stroke-width': 1,
        'circle-stroke-color': MAP_COLORS.surface,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 12, 1],
      },
    })
  } else {
    map.setPaintProperty(POINTS_LAYER_ID, 'circle-color', HEATMAP_HIGH_HEX)
  }
}

// ponytail: heatmap + titik; pastikan source ada sebelum setData; pulihkan setelah style.load.
export function HotspotHeatmapLayer({ regions }: HotspotHeatmapLayerProps) {
  const { map, isLoaded } = useMap()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const select = useMapStore((s) => s.select)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data } = useHotspots()
  const [activeHotspot, setActiveHotspot] = useState<ActiveHotspot | null>(null)
  const regionsRef = useRef(regions)
  const selectRef = useRef(select)
  const setPanelOpenRef = useRef(setPanelOpen)
  const selectedCodeRef = useRef(selectedCode)
  const collectionRef = useRef(
    filterHotspotsForMap(data, regions, province, selectedCode),
  )

  const collection = useMemo(
    () => filterHotspotsForMap(data, regions, province, selectedCode),
    [data, regions, province, selectedCode],
  )

  useEffect(() => {
    regionsRef.current = regions
    selectRef.current = select
    setPanelOpenRef.current = setPanelOpen
    selectedCodeRef.current = selectedCode
    collectionRef.current = collection
  }, [regions, select, setPanelOpen, selectedCode, collection])

  const tipHotspot = selectedCode ? null : activeHotspot

  useEffect(() => {
    if (!map || !isLoaded) return

    const syncData = () => {
      try {
        ensureHeatmapLayers(map)
        const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
        source?.setData(collectionRef.current)
        if (map.getLayer(POINTS_LAYER_ID)) {
          map.setLayoutProperty(
            POINTS_LAYER_ID,
            'visibility',
            selectedCodeRef.current ? 'none' : 'visible',
          )
        }
      } catch {
        // style swap mid-flight
      }
    }

    const readHotspot = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature || feature.geometry.type !== 'Point') return null
      const coords = feature.geometry.coordinates as [number, number]
      const props = (feature.properties ?? {}) as Record<string, unknown>
      const reg = regionsRef.current.find((r) => r.code === props.region_code)
      const updatedAt = formatUpdatedAt(
        typeof props.time === 'string' ? props.time : undefined,
        reg?.time_zone ?? 'WIB',
      )
      return {
        longitude: coords[0],
        latitude: coords[1],
        district:
          readOptionalString(props.district) ?? readOptionalString(props.kecamatan),
        regency:
          readOptionalString(props.kabupaten) ??
          readOptionalString(props.regency) ??
          readOptionalString(reg?.name),
        updatedAt,
      }
    }

    const openRegionFromEvent = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      const code = feature?.properties?.region_code
      if (typeof code !== 'string' || !code) return false
      const reg = regionsRef.current.find((r) => r.code === code)
      selectRef.current(code, reg?.province)
      setPanelOpenRef.current(true)
      return true
    }

    const onPointClick = (e: MapLayerMouseEvent) => {
      if (selectedCodeRef.current) return
      if (openRegionFromEvent(e)) {
        setActiveHotspot(null)
        return
      }
      const hit = readHotspot(e)
      if (!hit) return
      setActiveHotspot({ ...hit, pinned: true })
    }

    const onHeatmapClick = (e: MapLayerMouseEvent) => {
      if (selectedCodeRef.current) return
      if (openRegionFromEvent(e)) {
        setActiveHotspot(null)
      }
    }

    const onPointEnter = (e: MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer'
      if (selectedCodeRef.current) return
      const hit = readHotspot(e)
      if (!hit) return
      setActiveHotspot((prev) => (prev?.pinned ? prev : { ...hit, pinned: false }))
    }

    const onPointLeave = () => {
      map.getCanvas().style.cursor = ''
      setActiveHotspot((prev) => (prev?.pinned ? prev : null))
    }

    const onMapClick = (e: MapMouseEvent) => {
      if (!map.getLayer(POINTS_LAYER_ID)) return
      const features = map.queryRenderedFeatures(e.point, {
        layers: [POINTS_LAYER_ID],
      })
      if (!features || features.length === 0) {
        setActiveHotspot(null)
      }
    }

    syncData()

    if (typeof map.on === 'function') {
      map.on('style.load', syncData)
      map.on('click', POINTS_LAYER_ID, onPointClick)
      map.on('click', LAYER_ID, onHeatmapClick)
      map.on('mouseenter', POINTS_LAYER_ID, onPointEnter)
      map.on('mouseleave', POINTS_LAYER_ID, onPointLeave)
      map.on('click', onMapClick)
    }

    return () => {
      try {
        if (typeof map.off === 'function') {
          map.off('style.load', syncData)
          map.off('click', POINTS_LAYER_ID, onPointClick)
          map.off('click', LAYER_ID, onHeatmapClick)
          map.off('mouseenter', POINTS_LAYER_ID, onPointEnter)
          map.off('mouseleave', POINTS_LAYER_ID, onPointLeave)
          map.off('click', onMapClick)
        }
        if (map.getLayer(POINTS_LAYER_ID)) map.removeLayer(POINTS_LAYER_ID)
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // style reload
      }
    }
  }, [map, isLoaded])

  // Sync data + visibility tanpa recreate layer
  useEffect(() => {
    if (!map || !isLoaded) return
    try {
      ensureHeatmapLayers(map)
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
      source?.setData(collection)
      if (map.getLayer(POINTS_LAYER_ID)) {
        map.setLayoutProperty(
          POINTS_LAYER_ID,
          'visibility',
          selectedCode ? 'none' : 'visible',
        )
      }
    } catch {
      // style swap
    }
  }, [map, isLoaded, collection, selectedCode])

  return (
    <>
      {tipHotspot && (
        <MapPopup
          longitude={tipHotspot.longitude}
          latitude={tipHotspot.latitude}
          anchor="bottom"
          offset={14}
          onClose={() => setActiveHotspot(null)}
        >
          <MapInfoCard
            district={tipHotspot.district}
            regency={tipHotspot.regency}
            meta={getCopy().map.regionMetaHotspots('1')}
            updatedAt={tipHotspot.updatedAt}
          />
        </MapPopup>
      )}
    </>
  )
}
