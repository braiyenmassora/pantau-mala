import { useEffect, useMemo, useRef } from 'react'
import type { Feature, FeatureCollection, Point } from 'geojson'
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl'

import { useMap } from '@/components/ui/map'
import { useRegionCatalog } from '@/data/queries'
import type { Region, RiskCategory } from '@/data/types'
import { aggregateByProvince, provinceLabelAnchors } from '@/lib/province-aggregates'
import { MAP_COLORS } from '@/lib/map-colors'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { HEATMAP_TRANSPARENT, RISK_CATEGORIES } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'

const SOURCE_ID = 'province-radars-source'
const PULSE_LAYER_HIGH = 'province-radars-pulse-high'
const PULSE_LAYER_MID = 'province-radars-pulse-mid'
const CENTER_DOT_LAYER = 'province-radars-center-dot'

type ProvinceRadarProps = {
  name: string
  hotspots_24h: number
  risk_category: RiskCategory
  risk_rank: number
}

type ProvinceRadarsLayerProps = {
  regions: Region[]
}

export function ProvinceRadarsLayer({ regions }: ProvinceRadarsLayerProps) {
  const { map, isLoaded } = useMap()
  const { data: catalog } = useRegionCatalog()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const setProvince = useMapStore((s) => s.setProvince)
  const setProvinceRef = useRef(setProvince)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    setProvinceRef.current = setProvince
  }, [setProvince])

  const isNational = province === 'Semua' && !selectedCode

  const geojson = useMemo<FeatureCollection<Point, ProvinceRadarProps>>(() => {
    if (!isNational || !catalog) {
      return { type: 'FeatureCollection', features: [] }
    }

    const aggregates = aggregateByProvince(regions, catalog.provinces)
    const anchors = new Map(
      provinceLabelAnchors(catalog, regions).map((province) => [
        province.name,
        province.center,
      ]),
    )
    const features: Feature<Point, ProvinceRadarProps>[] = []

    for (const agg of aggregates) {
      if (agg.hotspots_24h <= 0) continue
      const riskRank =
        agg.risk_category === 'sangat_tinggi' ? 3 : agg.risk_category === 'sedang' ? 2 : 1
      if (riskRank < 2) continue

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: anchors.get(agg.name) ?? agg.center,
        },
        properties: {
          name: agg.name,
          hotspots_24h: agg.hotspots_24h,
          risk_category: agg.risk_category,
          risk_rank: riskRank,
        },
      })
    }

    return { type: 'FeatureCollection', features }
  }, [isNational, catalog, regions])

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
    }

    if (!map.getLayer(PULSE_LAYER_HIGH)) {
      map.addLayer({
        id: PULSE_LAYER_HIGH,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['>=', ['get', 'risk_rank'], 3],
        paint: {
          'circle-color': HEATMAP_TRANSPARENT,
          'circle-stroke-color': RISK_CATEGORIES.sangat_tinggi.dot,
          'circle-stroke-width': 2,
          'circle-radius': 14,
          'circle-stroke-opacity': 0.75,
          'circle-radius-transition': { duration: 0 },
          'circle-stroke-opacity-transition': { duration: 0 },
        },
      })
    }

    if (!map.getLayer(PULSE_LAYER_MID)) {
      map.addLayer({
        id: PULSE_LAYER_MID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['get', 'risk_rank'], 2],
        paint: {
          'circle-color': HEATMAP_TRANSPARENT,
          'circle-stroke-color': RISK_CATEGORIES.sedang.dot,
          'circle-stroke-width': 1.5,
          'circle-radius': 12,
          'circle-stroke-opacity': 0.65,
          'circle-radius-transition': { duration: 0 },
          'circle-stroke-opacity-transition': { duration: 0 },
        },
      })
    }

    if (!map.getLayer(CENTER_DOT_LAYER)) {
      map.addLayer({
        id: CENTER_DOT_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 4.5,
          'circle-color': [
            'case',
            ['>=', ['get', 'risk_rank'], 3],
            RISK_CATEGORIES.sangat_tinggi.dot,
            RISK_CATEGORIES.sedang.dot,
          ],
          'circle-stroke-color': MAP_COLORS.surface,
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.95,
        },
      })
    }

    const onRadarClick = (e: MapLayerMouseEvent) => {
      const name = e.features?.[0]?.properties?.name
      if (typeof name === 'string' && name) {
        setProvinceRef.current(name)
      }
    }

    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    const layers = [CENTER_DOT_LAYER, PULSE_LAYER_HIGH, PULSE_LAYER_MID]
    map.on('click', layers, onRadarClick)
    map.on('mouseenter', layers, onEnter)
    map.on('mouseleave', layers, onLeave)

    return () => {
      try {
        map.off('click', layers, onRadarClick)
        map.off('mouseenter', layers, onEnter)
        map.off('mouseleave', layers, onLeave)
        map.getCanvas().style.cursor = ''
        if (map.getLayer(CENTER_DOT_LAYER)) map.removeLayer(CENTER_DOT_LAYER)
        if (map.getLayer(PULSE_LAYER_MID)) map.removeLayer(PULSE_LAYER_MID)
        if (map.getLayer(PULSE_LAYER_HIGH)) map.removeLayer(PULSE_LAYER_HIGH)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // teardown
      }
    }
  }, [map, isLoaded])

  useEffect(() => {
    if (!map || !isLoaded) return
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    source?.setData(geojson)
  }, [map, isLoaded, geojson])

  useEffect(() => {
    if (!map || !isLoaded || reducedMotion || typeof requestAnimationFrame !== 'function')
      return

    let frame = 0
    let lastFrame = 0
    const animate = (time: number) => {
      if (!document.hidden && time - lastFrame > 40) {
        lastFrame = time
        const highPhase = (time % 850) / 850
        const midPhase = (time % 1800) / 1800

        try {
          if (map.getLayer(PULSE_LAYER_HIGH)) {
            map.setPaintProperty(PULSE_LAYER_HIGH, 'circle-radius', 6 + highPhase * 18)
            map.setPaintProperty(
              PULSE_LAYER_HIGH,
              'circle-stroke-opacity',
              Math.max(0, 0.8 * (1 - highPhase)),
            )
          }
          if (map.getLayer(PULSE_LAYER_MID)) {
            map.setPaintProperty(PULSE_LAYER_MID, 'circle-radius', 5 + midPhase * 14)
            map.setPaintProperty(
              PULSE_LAYER_MID,
              'circle-stroke-opacity',
              Math.max(0, 0.7 * (1 - midPhase)),
            )
          }
        } catch {
          return
        }
      }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [map, isLoaded, reducedMotion, isNational])

  return null
}
