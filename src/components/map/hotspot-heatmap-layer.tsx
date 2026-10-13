import { HEATMAP_TRANSPARENT, HEATMAP_ORANGE } from '@/lib/risk-category'
import { useEffect, useMemo } from 'react'
import type { GeoJSONSource } from 'maplibre-gl'

import { useMap } from '@/components/ui/map'
import { useHotspots } from '@/data/queries'
import type { Region } from '@/data/types'
import { filterHotspotsForMap } from '@/lib/filter-hotspots-for-map'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'

const SOURCE_ID = 'fy-hotspot-heatmap'
const LAYER_ID = 'fy-hotspot-heatmap-layer'

/** Show observed density at every zoom, including the initial national view. */
export const HEATMAP_MIN_ZOOM = 0

type HotspotHeatmapLayerProps = {
  regions: Region[]
}

/**
 * Satellite point density, independent of unavailable regional risk categories.
 * Render sparse and dense observations with precision heat gradient.
 */
export function HotspotHeatmapLayer({ regions }: HotspotHeatmapLayerProps) {
  const { map, isLoaded } = useMap()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const { data } = useHotspots()

  const collection = useMemo(
    () => filterHotspotsForMap(data, regions, province, selectedCode),
    [data, regions, province, selectedCode],
  )

  const mid = RISK_CATEGORIES.sedang.dot
  const high = RISK_CATEGORIES.sangat_tinggi.dot

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: collection,
      })
    }

    if (!map.getLayer(LAYER_ID)) {
      map.addLayer({
        id: LAYER_ID,
        type: 'heatmap',
        source: SOURCE_ID,
        minzoom: HEATMAP_MIN_ZOOM,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            0.12,
            4,
            0.25,
            7,
            0.65,
            10,
            1.1,
            14,
            1.5,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            HEATMAP_TRANSPARENT,
            0.15,
            `${mid}30`,
            0.35,
            `${mid}85`,
            0.55,
            mid,
            0.75,
            HEATMAP_ORANGE,
            0.9,
            high,
            1,
            high,
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            2,
            4,
            5,
            7,
            10,
            10,
            18,
            13,
            26,
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            0.35,
            4,
            0.5,
            8,
            0.7,
            12,
            0.8,
          ],
        },
      })
    }

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // style reload
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, mid, high])

  useEffect(() => {
    if (!map || !isLoaded) return
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    source?.setData(collection)
  }, [map, isLoaded, collection])

  return null
}
