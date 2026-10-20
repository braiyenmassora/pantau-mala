import { useEffect, useMemo } from 'react'
import type { Feature, FeatureCollection, Point } from 'geojson'
import type { GeoJSONSource, SymbolLayerSpecification } from 'maplibre-gl'

import { useMap } from '@/components/ui/map'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { MAP_COLORS } from '@/lib/map-colors'
import { provinceLabelAnchors } from '@/lib/province-aggregates'
import { useMapStore } from '@/store/map'

const SOURCE_ID = 'province-labels-source'
const LAYER_ID = 'province-labels-layer'

type ProvinceLabelsLayerProps = {
  regions: Region[]
}

// ponytail: level nasional — nama provinsi di pusat catalog (collision MapLibre atur overlap).
export function ProvinceLabelsLayer({ regions }: ProvinceLabelsLayerProps) {
  const { map, isLoaded } = useMap()
  const { data: catalog } = useRegionCatalog()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)

  const isNational = province === 'Semua' && !selectedCode

  const geojson = useMemo<FeatureCollection<Point>>(() => {
    if (!isNational || !catalog) {
      return { type: 'FeatureCollection', features: [] }
    }

    // Provinsi yang punya titik panas ditampilkan dulu; sisanya tetap ada agar peta punya nama.
    const withHotspots = new Set(
      regions.filter((r) => r.hotspots_24h > 0).map((r) => r.province),
    )

    const features: Feature<Point>[] = []
    for (const p of provinceLabelAnchors(catalog, regions)) {
      const [lon, lat] = p.center
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          name: p.name,
          rank: withHotspots.has(p.name) ? 1 : 0,
        },
      })
    }

    // Prioritas collision: yang punya hotspot lebih dulu
    features.sort((a, b) => (b.properties?.rank ?? 0) - (a.properties?.rank ?? 0))
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

    if (!map.getLayer(LAYER_ID)) {
      const layout: SymbolLayerSpecification['layout'] = {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular'],
        'text-size': 11,
        'text-anchor': 'top',
        'text-offset': [0, 0.9],
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'symbol-sort-key': ['-', ['get', 'rank']],
      }
      map.addLayer({
        id: LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout,
        paint: {
          'text-color': MAP_COLORS.ink,
          'text-halo-color': MAP_COLORS.surface,
          'text-halo-width': 1.5,
          'text-opacity': 0.9,
        },
      })
    }

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // teardown
      }
    }
  }, [map, isLoaded])

  useEffect(() => {
    if (!map || !isLoaded) return
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    src?.setData(geojson)
  }, [map, isLoaded, geojson])

  return null
}
