import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  GeoJSONSource,
  HeatmapLayerSpecification,
  MapLayerMouseEvent,
  MapMouseEvent,
} from 'maplibre-gl'

import { MapInfoCard } from '@/components/map/map-info-card'
import { MapPopup, useMap } from '@/components/ui/map'
import { useHotspots } from '@/data/queries'
import type { Region } from '@/data/types'
import { filterHotspotsForMap } from '@/lib/filter-hotspots-for-map'
import { MAP_COLORS } from '@/lib/map-colors'
import {
  HEATMAP_LOW_HEX,
  HEATMAP_TRANSPARENT,
  HOTSPOT_HEX,
  RISK_CATEGORIES,
} from '@/lib/risk-category'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const SOURCE_ID = 'fy-hotspot-heatmap'
const LAYER_ID = 'fy-hotspot-heatmap-layer'
const POINTS_LAYER_ID = 'fy-hotspot-points-layer'

export const HEATMAP_MIN_ZOOM = 0

type HotspotHeatmapLayerProps = {
  regions: Region[]
}

type ActiveHotspot = {
  longitude: number
  latitude: number
  district?: string
  regency?: string
  detectedTime?: string
  pinned: boolean
}

function formatDetectedTime(rawTime?: string, tz = 'WIB'): string | undefined {
  if (!rawTime) return undefined
  try {
    const d = new Date(rawTime)
    if (isNaN(d.getTime())) {
      if (/^\d{1,2}[:.]\d{2}/.test(rawTime)) {
        return `${rawTime} ${tz}`
      }
      return undefined
    }
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${tz}`
  } catch {
    return undefined
  }
}

const HEATMAP_PAINT: HeatmapLayerSpecification['paint'] = {
  'heatmap-weight': 1,
  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 4, 5, 7, 8, 11, 24],
  'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    HEATMAP_TRANSPARENT,
    0.2,
    HEATMAP_LOW_HEX,
    0.5,
    RISK_CATEGORIES.sedang.dot,
    1,
    RISK_CATEGORIES.sangat_tinggi.dot,
  ],
  'heatmap-opacity': [
    'interpolate',
    ['linear'],
    ['zoom'],
    0,
    0.5,
    7,
    0.65,
    10,
    0.5,
    12,
    0.25,
  ],
}

// ponytail: heatmap + titik; setup sekali, data di-setData — jangan removeLayer tiap render.
export function HotspotHeatmapLayer({ regions }: HotspotHeatmapLayerProps) {
  const { map, isLoaded } = useMap()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data } = useHotspots()
  const [activeHotspot, setActiveHotspot] = useState<ActiveHotspot | null>(null)
  const regionsRef = useRef(regions)
  const selectRef = useRef(select)
  const panelOpenRef = useRef(panelOpen)
  const setPanelOpenRef = useRef(setPanelOpen)

  useEffect(() => {
    regionsRef.current = regions
    selectRef.current = select
    panelOpenRef.current = panelOpen
    setPanelOpenRef.current = setPanelOpen
  }, [regions, select, panelOpen, setPanelOpen])

  const collection = useMemo(
    () => filterHotspotsForMap(data, regions, province, selectedCode),
    [data, regions, province, selectedCode],
  )

  // Setup layer + handler sekali
  useEffect(() => {
    if (!map || !isLoaded) return

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
    }

    if (!map.getLayer(POINTS_LAYER_ID)) {
      map.addLayer({
        id: POINTS_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        minzoom: 0,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 1.5, 7, 2.5, 12, 3.5],
          'circle-color': HOTSPOT_HEX,
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 0, 0.3, 10, 1],
          'circle-stroke-color': MAP_COLORS.surface,
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.7, 12, 1],
        },
      })
    }

    const readHotspot = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature || feature.geometry.type !== 'Point') return null
      const coords = feature.geometry.coordinates as [number, number]
      const props = (feature.properties ?? {}) as Record<string, unknown>
      const reg = regionsRef.current.find((r) => r.code === props.region_code)
      const timeStr = formatDetectedTime(
        typeof props.time === 'string' ? props.time : undefined,
        reg?.time_zone ?? 'WIB',
      )
      return {
        longitude: coords[0],
        latitude: coords[1],
        district:
          typeof props.district === 'string'
            ? props.district
            : typeof props.kecamatan === 'string'
              ? props.kecamatan
              : undefined,
        regency:
          typeof props.kabupaten === 'string'
            ? props.kabupaten
            : typeof props.regency === 'string'
              ? props.regency
              : reg?.name,
        detectedTime: timeStr,
      }
    }

    const openRegionFromEvent = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      const code = feature?.properties?.region_code
      if (typeof code !== 'string' || !code) return false
      const reg = regionsRef.current.find((r) => r.code === code)
      selectRef.current(code, reg?.province)
      if (!panelOpenRef.current) setPanelOpenRef.current(true)
      return true
    }

    const onPointClick = (e: MapLayerMouseEvent) => {
      // Klik titik/heatmap merah → buka detail kabupaten bila ada region_code
      if (openRegionFromEvent(e)) {
        setActiveHotspot(null)
        return
      }
      const hit = readHotspot(e)
      if (!hit) return
      setActiveHotspot({ ...hit, pinned: true })
    }

    const onHeatmapClick = (e: MapLayerMouseEvent) => {
      if (openRegionFromEvent(e)) {
        setActiveHotspot(null)
      }
    }

    const onPointEnter = (e: MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer'
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

    if (typeof map.on === 'function') {
      map.on('click', POINTS_LAYER_ID, onPointClick)
      map.on('click', LAYER_ID, onHeatmapClick)
      map.on('mouseenter', POINTS_LAYER_ID, onPointEnter)
      map.on('mouseleave', POINTS_LAYER_ID, onPointLeave)
      map.on('click', onMapClick)
    }

    return () => {
      try {
        if (typeof map.off === 'function') {
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

  // Hanya setData — tidak recreate layer
  useEffect(() => {
    if (!map || !isLoaded) return
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    source?.setData(collection)
  }, [map, isLoaded, collection])

  return (
    <>
      {activeHotspot && (
        <MapPopup
          longitude={activeHotspot.longitude}
          latitude={activeHotspot.latitude}
          anchor="bottom"
          offset={14}
          onClose={() => setActiveHotspot(null)}
        >
          <MapInfoCard
            district={activeHotspot.district}
            regency={activeHotspot.regency}
            detectedTime={activeHotspot.detectedTime}
          />
        </MapPopup>
      )}
    </>
  )
}
