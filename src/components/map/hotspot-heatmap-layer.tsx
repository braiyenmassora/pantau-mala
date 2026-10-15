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
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import {
  HEATMAP_LOW_HEX,
  HEATMAP_TRANSPARENT,
  HOTSPOT_HEX,
  RISK_CATEGORIES,
} from '@/lib/risk-category'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const SOURCE_ID = 'fy-hotspot-heatmap'
const CLUSTERS_SOURCE_ID = 'fy-hotspot-clusters'
const LAYER_ID = 'fy-hotspot-heatmap-layer'
const PULSE_LAYER_HIGH = 'fy-hotspot-pulse-high'
const PULSE_LAYER_MID = 'fy-hotspot-pulse-mid'
const CLUSTERS_LAYER_ID = 'fy-hotspot-clusters-layer'
const CLUSTER_COUNT_LAYER_ID = 'fy-hotspot-cluster-count-layer'
const POINTS_LAYER_ID = 'fy-hotspot-points-layer'
const CLUSTER_HIT_LAYERS = [CLUSTERS_LAYER_ID, CLUSTER_COUNT_LAYER_ID]

const CLUSTER_RADIUS = 50
const CLUSTER_MAX_ZOOM = 10

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
  'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 4, 8, 7, 14, 11, 24],
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

    if (!map.getSource(CLUSTERS_SOURCE_ID)) {
      map.addSource(CLUSTERS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: CLUSTER_RADIUS,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        clusterProperties: {
          max_risk: ['max', ['coalesce', ['get', 'risk_rank'], 0]],
        },
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

    if (!map.getLayer(PULSE_LAYER_HIGH)) {
      map.addLayer({
        id: PULSE_LAYER_HIGH,
        type: 'circle',
        source: CLUSTERS_SOURCE_ID,
        filter: [
          'any',
          [
            'all',
            ['has', 'point_count'],
            ['>=', ['coalesce', ['get', 'max_risk'], 0], 3],
          ],
          [
            'all',
            ['!', ['has', 'point_count']],
            ['>=', ['coalesce', ['get', 'risk_rank'], 0], 3],
          ],
        ],
        paint: {
          'circle-color': HEATMAP_TRANSPARENT,
          'circle-stroke-color': RISK_CATEGORIES.sangat_tinggi.dot,
          'circle-stroke-width': 1,
          'circle-radius': ['case', ['has', 'point_count'], 12, 3],
          'circle-stroke-opacity': 0.3,
          'circle-radius-transition': { duration: 0 },
          'circle-stroke-opacity-transition': { duration: 0 },
        },
      })
    }

    if (!map.getLayer(PULSE_LAYER_MID)) {
      map.addLayer({
        id: PULSE_LAYER_MID,
        type: 'circle',
        source: CLUSTERS_SOURCE_ID,
        filter: [
          'any',
          [
            'all',
            ['has', 'point_count'],
            ['==', ['coalesce', ['get', 'max_risk'], 0], 2],
          ],
          [
            'all',
            ['!', ['has', 'point_count']],
            ['==', ['coalesce', ['get', 'risk_rank'], 0], 2],
          ],
        ],
        paint: {
          'circle-color': HEATMAP_TRANSPARENT,
          'circle-stroke-color': RISK_CATEGORIES.sedang.dot,
          'circle-stroke-width': 1,
          'circle-radius': ['case', ['has', 'point_count'], 12, 3],
          'circle-stroke-opacity': 0.3,
          'circle-radius-transition': { duration: 0 },
          'circle-stroke-opacity-transition': { duration: 0 },
        },
      })
    }

    if (!map.getLayer(CLUSTERS_LAYER_ID)) {
      map.addLayer({
        id: CLUSTERS_LAYER_ID,
        type: 'circle',
        source: CLUSTERS_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': MAP_COLORS.surface,
          'circle-radius': ['step', ['get', 'point_count'], 8.5, 20, 10, 100, 11.5],
          'circle-stroke-color': [
            'case',
            ['>=', ['coalesce', ['get', 'max_risk'], 0], 3],
            RISK_CATEGORIES.sangat_tinggi.dot,
            ['==', ['coalesce', ['get', 'max_risk'], 0], 2],
            RISK_CATEGORIES.sedang.dot,
            HOTSPOT_HEX,
          ],
          'circle-stroke-width': 1,
          'circle-opacity': 0.98,
        },
      })
    }

    if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: CLUSTERS_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': MAP_COLORS.ink,
        },
      })
    }

    if (!map.getLayer(POINTS_LAYER_ID)) {
      map.addLayer({
        id: POINTS_LAYER_ID,
        type: 'circle',
        source: CLUSTERS_SOURCE_ID,
        minzoom: 0,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 1.5, 7, 2.5, 12, 3.5],
          'circle-color': HOTSPOT_HEX,
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 10, 1],
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

    let disposed = false
    const onClusterClick = async (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature || feature.geometry.type !== 'Point') return

      const clusterId = feature.properties?.cluster_id
      const source = map.getSource(CLUSTERS_SOURCE_ID) as GeoJSONSource | undefined
      if (typeof clusterId !== 'number' || !source?.getClusterExpansionZoom) return

      try {
        const zoom = await source.getClusterExpansionZoom(clusterId)
        if (disposed || map.getSource(CLUSTERS_SOURCE_ID) !== source) return
        const coordinates = feature.geometry.coordinates as [number, number]
        map.easeTo({
          center: coordinates,
          zoom: Math.min(zoom, 12),
          duration: 500,
        })
      } catch {
        // The source can be replaced while the map style is reloading.
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

    const onClusterEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const onClusterLeave = () => {
      map.getCanvas().style.cursor = ''
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
      map.on('click', CLUSTER_HIT_LAYERS, onClusterClick)
      map.on('click', POINTS_LAYER_ID, onPointClick)
      map.on('mouseenter', CLUSTER_HIT_LAYERS, onClusterEnter)
      map.on('mouseleave', CLUSTER_HIT_LAYERS, onClusterLeave)
      map.on('mouseenter', POINTS_LAYER_ID, onPointEnter)
      map.on('mouseleave', POINTS_LAYER_ID, onPointLeave)
      map.on('click', onMapClick)
    }

    return () => {
      disposed = true
      try {
        if (typeof map.off === 'function') {
          map.off('click', CLUSTER_HIT_LAYERS, onClusterClick)
          map.off('click', POINTS_LAYER_ID, onPointClick)
          map.off('mouseenter', CLUSTER_HIT_LAYERS, onClusterEnter)
          map.off('mouseleave', CLUSTER_HIT_LAYERS, onClusterLeave)
          map.off('mouseenter', POINTS_LAYER_ID, onPointEnter)
          map.off('mouseleave', POINTS_LAYER_ID, onPointLeave)
          map.off('click', onMapClick)
        }
        if (map.getLayer(POINTS_LAYER_ID)) map.removeLayer(POINTS_LAYER_ID)
        if (map.getLayer(CLUSTER_COUNT_LAYER_ID)) map.removeLayer(CLUSTER_COUNT_LAYER_ID)
        if (map.getLayer(CLUSTERS_LAYER_ID)) map.removeLayer(CLUSTERS_LAYER_ID)
        if (map.getLayer(PULSE_LAYER_HIGH)) map.removeLayer(PULSE_LAYER_HIGH)
        if (map.getLayer(PULSE_LAYER_MID)) map.removeLayer(PULSE_LAYER_MID)
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
        if (map.getSource(CLUSTERS_SOURCE_ID)) map.removeSource(CLUSTERS_SOURCE_ID)
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
    const clusterSource = map.getSource(CLUSTERS_SOURCE_ID) as GeoJSONSource | undefined
    clusterSource?.setData(collection)
  }, [map, isLoaded, collection])

  const reducedMotion = usePrefersReducedMotion()
  const hasRadar = collection.features.some(
    (feature) => feature.properties.risk_rank >= 2,
  )

  useEffect(() => {
    if (!map || !isLoaded) return
    for (const layerId of [PULSE_LAYER_HIGH, PULSE_LAYER_MID]) {
      if (!map.getLayer(layerId)) continue
      map.setPaintProperty(layerId, 'circle-radius', [
        'case',
        ['has', 'point_count'],
        12,
        3,
      ])
      map.setPaintProperty(layerId, 'circle-stroke-opacity', 0.3)
    }
    if (!hasRadar || reducedMotion || typeof requestAnimationFrame !== 'function') return

    let frame = 0
    let lastFrame = 0
    const animateRadar = (time: number) => {
      if (!document.hidden && time - lastFrame > 50) {
        lastFrame = time
        const highPhase = (time % 1000) / 1000
        const midPhase = (time % 2000) / 2000
        try {
          if (map.getLayer(PULSE_LAYER_HIGH)) {
            map.setPaintProperty(PULSE_LAYER_HIGH, 'circle-radius', [
              'case',
              ['has', 'point_count'],
              12 + highPhase * 5,
              3 + highPhase * 3,
            ])
            map.setPaintProperty(
              PULSE_LAYER_HIGH,
              'circle-stroke-opacity',
              0.35 * (1 - highPhase),
            )
          }
          if (map.getLayer(PULSE_LAYER_MID)) {
            map.setPaintProperty(PULSE_LAYER_MID, 'circle-radius', [
              'case',
              ['has', 'point_count'],
              12 + midPhase * 5,
              3 + midPhase * 3,
            ])
            map.setPaintProperty(
              PULSE_LAYER_MID,
              'circle-stroke-opacity',
              0.35 * (1 - midPhase),
            )
          }
        } catch {
          return
        }
      }
      frame = requestAnimationFrame(animateRadar)
    }
    frame = requestAnimationFrame(animateRadar)

    return () => cancelAnimationFrame(frame)
  }, [map, isLoaded, reducedMotion, hasRadar])

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
