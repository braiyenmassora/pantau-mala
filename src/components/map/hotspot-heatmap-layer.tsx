import { HEATMAP_TRANSPARENT } from '@/lib/risk-category'
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

/** Zoom minimum agar heatmap tampil (di bawah ini hemat GPU). */
export const HEATMAP_MIN_ZOOM = 6.5

/** Samakan dengan DOM_MARKER_MAX — di bawah ini titik jelas, tanpa blur heatmap. */
const HEATMAP_MIN_POINTS = 65

type HotspotHeatmapLayerProps = {
  regions: Region[]
}

/**
 * Gradient kuning→merah dari `/v1/hotspots` saat banyak titik.
 * Titik sedikit: layer kosong (marker DOM saja, biar warna tajam).
 */
export function HotspotHeatmapLayer({ regions }: HotspotHeatmapLayerProps) {
  const { map, isLoaded } = useMap()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const { data } = useHotspots()

  const collection = useMemo(() => {
    const raw = filterHotspotsForMap(data, regions, province, selectedCode)
    if (raw.features.length < HEATMAP_MIN_POINTS) {
      return { type: 'FeatureCollection' as const, features: [] }
    }
    return raw
  }, [data, regions, province, selectedCode])

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
            HEATMAP_MIN_ZOOM,
            0.7,
            11,
            1.35,
            14,
            1.7,
          ],
          // Stop tajam: jarang = kuning solid, padat = merah solid (hindari oranye kabur).
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            HEATMAP_TRANSPARENT,
            0.12,
            `${mid}40`,
            0.28,
            mid,
            0.5,
            mid,
            0.62,
            high,
            1,
            high,
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            HEATMAP_MIN_ZOOM,
            18,
            11,
            26,
            14,
            32,
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            HEATMAP_MIN_ZOOM,
            0.65,
            12,
            0.78,
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
