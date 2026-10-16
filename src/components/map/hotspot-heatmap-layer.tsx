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
import type { ConfidenceLevel, Region, TimeZoneId } from '@/data/types'
import { filterHotspotsForMap } from '@/lib/filter-hotspots-for-map'
import { formatDateTime } from '@/lib/format'
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

export const HEATMAP_MIN_ZOOM = 7

type HotspotHeatmapLayerProps = {
  regions: Region[]
}

type ActiveHotspot = {
  longitude: number
  latitude: number
  district?: string
  regency?: string
  detectedTime?: string
  satellite?: string
  confidence?: ConfidenceLevel
  pinned: boolean
}

function readConfidence(value: unknown): ConfidenceLevel | undefined {
  if (value === 'rendah' || value === 'sedang' || value === 'tinggi') return value
  return undefined
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const t = value.trim()
  return t ? t : undefined
}

/** Deteksi dari timestamp UTC → jam zona wilayah (bukan zona browser). */
function formatDetectedTime(
  rawTime: string | undefined,
  zone: TimeZoneId,
): string | undefined {
  if (!rawTime) return undefined
  if (Number.isNaN(Date.parse(rawTime))) return undefined
  return formatDateTime(rawTime, zone)
}

const HEATMAP_PAINT = {
  'heatmap-weight': 1,
  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 7, 8, 11, 24],
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
  'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.75, 10, 0.75, 12, 0],
} satisfies NonNullable<HeatmapLayerSpecification['paint']>

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
  const selectedCodeRef = useRef(selectedCode)

  useEffect(() => {
    regionsRef.current = regions
    selectRef.current = select
    panelOpenRef.current = panelOpen
    setPanelOpenRef.current = setPanelOpen
    selectedCodeRef.current = selectedCode
  }, [regions, select, panelOpen, setPanelOpen, selectedCode])

  // Detail kab: tip DOM di SelectedHotspotsLayer — jangan dobel dengan popup heatmap.
  if (selectedCode && activeHotspot) setActiveHotspot(null)

  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer?.(POINTS_LAYER_ID)) return
    map.setLayoutProperty(
      POINTS_LAYER_ID,
      'visibility',
      selectedCode ? 'none' : 'visible',
    )
  }, [map, isLoaded, selectedCode])

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
    } else {
      map.setPaintProperty(LAYER_ID, 'heatmap-color', HEATMAP_PAINT['heatmap-color'])
      map.setPaintProperty(LAYER_ID, 'heatmap-opacity', HEATMAP_PAINT['heatmap-opacity'])
      map.setPaintProperty(LAYER_ID, 'heatmap-radius', HEATMAP_PAINT['heatmap-radius'])
      map.setPaintProperty(LAYER_ID, 'heatmap-weight', HEATMAP_PAINT['heatmap-weight'])
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
          readOptionalString(props.district) ?? readOptionalString(props.kecamatan),
        regency:
          readOptionalString(props.kabupaten) ??
          readOptionalString(props.regency) ??
          readOptionalString(reg?.name),
        detectedTime: timeStr,
        satellite: readOptionalString(props.satellite),
        confidence: readConfidence(props.confidence),
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
      if (selectedCodeRef.current) return
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
            satellite={activeHotspot.satellite}
            confidence={activeHotspot.confidence}
          />
        </MapPopup>
      )}
    </>
  )
}
