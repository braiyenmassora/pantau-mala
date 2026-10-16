import { useEffect, useMemo, useRef } from 'react'
import type {
  FillLayerSpecification,
  LineLayerSpecification,
  MapLayerMouseEvent,
} from 'maplibre-gl'

import { useMap } from '@/components/ui/map'
import { useProvinceBoundaries } from '@/data/province-boundaries'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { MAP_COLORS } from '@/lib/map-colors'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { normalizeProvinceName } from '@/lib/province-boundaries'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'

const SOURCE_ID = 'province-choropleth-source'
const FILL_LAYER = 'province-choropleth-fill'
const BOUNDARY_LINE_LAYER = 'province-choropleth-line'
const BASEMAP_BOUNDARY_LAYER = 'boundary_state'

/** Soft fill — pola lutuk/personal: opacity rendah, di bawah water/batas CARTO. */
function buildFillPaint(
  selectedId: string | null,
): NonNullable<FillLayerSpecification['paint']> {
  return {
    'fill-color': selectedId
      ? [
          'case',
          ['==', ['get', 'province_id'], selectedId],
          ['coalesce', ['feature-state', 'riskColor'], MAP_COLORS.surface],
          [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            ['coalesce', ['feature-state', 'riskColor'], MAP_COLORS.surface],
            MAP_COLORS.surface,
          ],
        ]
      : ['coalesce', ['feature-state', 'riskColor'], MAP_COLORS.surface],
    'fill-opacity': selectedId
      ? [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.2,
          ['==', ['get', 'province_id'], selectedId],
          0.16,
          0.035,
        ]
      : [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.16,
          ['>', ['coalesce', ['feature-state', 'hotspots'], 0], 0],
          0.12,
          0,
        ],
    'fill-antialias': true,
    'fill-outline-color': 'transparent',
  }
}

function buildBoundaryLinePaint(
  selectedId: string | null,
): NonNullable<LineLayerSpecification['paint']> {
  return {
    'line-color': MAP_COLORS.surface,
    'line-width': selectedId
      ? [
          'case',
          ['==', ['get', 'province_id'], selectedId],
          2,
          ['boolean', ['feature-state', 'hover'], false],
          1.5,
          1.2,
        ]
      : ['case', ['boolean', ['feature-state', 'hover'], false], 1.5, 1.2],
    'line-opacity': selectedId
      ? [
          'case',
          ['==', ['get', 'province_id'], selectedId],
          1,
          ['boolean', ['feature-state', 'hover'], false],
          0.95,
          0.85,
        ]
      : ['case', ['boolean', ['feature-state', 'hover'], false], 0.95, 0.85],
  }
}

type ProvinceChoroplethLayerProps = {
  regions: Region[]
}

export function ProvinceChoroplethLayer({ regions }: ProvinceChoroplethLayerProps) {
  const { map, isLoaded } = useMap()
  const { data: catalog } = useRegionCatalog()
  const { data: boundaries, isError } = useProvinceBoundaries()
  const province = useMapStore((state) => state.province)
  const setProvince = useMapStore((state) => state.setProvince)
  const reducedMotion = usePrefersReducedMotion()
  const catalogRef = useRef(catalog)
  const setProvinceRef = useRef(setProvince)

  useEffect(() => {
    catalogRef.current = catalog
    setProvinceRef.current = setProvince
  }, [catalog, setProvince])

  const provinceMetrics = useMemo(() => {
    if (!boundaries) return []
    const counts = new Map<string, number>()
    for (const region of regions) {
      const name = normalizeProvinceName(region.province)
      counts.set(name, (counts.get(name) ?? 0) + region.hotspots_24h)
    }

    return boundaries.geometry.features.map((feature) => {
      const provinceName = feature.properties.province_name
      const hotspots = counts.get(normalizeProvinceName(provinceName)) ?? 0
      const riskColor =
        hotspots >= 10
          ? RISK_CATEGORIES.sangat_tinggi.dot
          : hotspots > 0
            ? RISK_CATEGORIES.sedang.dot
            : RISK_CATEGORIES.rendah.dot
      return { id: feature.id, hotspots, riskColor }
    })
  }, [boundaries, regions])

  const selectedId = useMemo(
    () =>
      province === 'Semua'
        ? null
        : (boundaries?.provinces.find(
            (boundary) =>
              normalizeProvinceName(boundary.name) === normalizeProvinceName(province),
          )?.id ?? null),
    [boundaries, province],
  )

  useEffect(() => {
    if (!map || !isLoaded || !boundaries) return
    const anchor = map.getLayer(BASEMAP_BOUNDARY_LAYER)
      ? BASEMAP_BOUNDARY_LAYER
      : map.getLayer('tunnel_service_case')
        ? 'tunnel_service_case'
        : undefined

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: boundaries.geometry,
        promoteId: 'province_id',
        tolerance: 0,
        buffer: 64,
      })
    }
    if (!map.getLayer(FILL_LAYER)) {
      map.addLayer(
        { id: FILL_LAYER, type: 'fill', source: SOURCE_ID, paint: buildFillPaint(null) },
        anchor,
      )
    }
    if (!map.getLayer(BOUNDARY_LINE_LAYER)) {
      map.addLayer(
        {
          id: BOUNDARY_LINE_LAYER,
          type: 'line',
          source: SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: buildBoundaryLinePaint(null),
        },
        map.getLayer('water') ? 'water' : anchor,
      )
    }

    let hoveredId: string | null = null
    const targetProvince = (event: MapLayerMouseEvent) => {
      const name = String(event.features?.[0]?.properties?.province_name ?? '')
      return catalogRef.current?.provinces.find(
        (candidate) =>
          normalizeProvinceName(candidate.name) === normalizeProvinceName(name),
      )
    }
    const onClick = (event: MapLayerMouseEvent) => {
      const target = targetProvince(event)
      if (target) setProvinceRef.current(target.name)
    }
    const onMove = (event: MapLayerMouseEvent) => {
      const target = targetProvince(event)
      map.getCanvas().style.cursor = target ? 'pointer' : ''
      const next = target
        ? String(event.features?.[0]?.properties?.province_id ?? '')
        : null
      if (next === hoveredId) return
      if (hoveredId)
        map.setFeatureState({ source: SOURCE_ID, id: hoveredId }, { hover: false })
      hoveredId = next
      if (next) map.setFeatureState({ source: SOURCE_ID, id: next }, { hover: true })
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
      if (hoveredId)
        map.setFeatureState({ source: SOURCE_ID, id: hoveredId }, { hover: false })
      hoveredId = null
    }

    map.on('click', FILL_LAYER, onClick)
    map.on('mouseenter', FILL_LAYER, onMove)
    map.on('mousemove', FILL_LAYER, onMove)
    map.on('mouseleave', FILL_LAYER, onLeave)

    return () => {
      map.off('click', FILL_LAYER, onClick)
      map.off('mouseenter', FILL_LAYER, onMove)
      map.off('mousemove', FILL_LAYER, onMove)
      map.off('mouseleave', FILL_LAYER, onLeave)
      map.getCanvas().style.cursor = ''
      if (map.getLayer(BOUNDARY_LINE_LAYER)) map.removeLayer(BOUNDARY_LINE_LAYER)
      if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map, isLoaded, boundaries])

  useEffect(() => {
    if (!map || !isLoaded || !map.getSource(SOURCE_ID)) return
    for (const { id, hotspots, riskColor } of provinceMetrics) {
      map.setFeatureState({ source: SOURCE_ID, id }, { hotspots, riskColor })
    }
  }, [map, isLoaded, provinceMetrics])

  useEffect(() => {
    if (!map || !isLoaded || !boundaries || !map.getLayer(FILL_LAYER)) return
    map.setPaintProperty(FILL_LAYER, 'fill-opacity-transition', {
      duration: reducedMotion ? 0 : 180,
      delay: 0,
    })
    map.setPaintProperty(FILL_LAYER, 'fill-color-transition', {
      duration: reducedMotion ? 0 : 180,
      delay: 0,
    })
    const fillPaint = buildFillPaint(selectedId)
    map.setPaintProperty(FILL_LAYER, 'fill-color', fillPaint['fill-color'])
    map.setPaintProperty(FILL_LAYER, 'fill-opacity', fillPaint['fill-opacity'])
    map.setPaintProperty(FILL_LAYER, 'fill-antialias', fillPaint['fill-antialias'])
    map.setPaintProperty(
      FILL_LAYER,
      'fill-outline-color',
      fillPaint['fill-outline-color'],
    )

    if (map.getLayer(BOUNDARY_LINE_LAYER)) {
      const linePaint = buildBoundaryLinePaint(selectedId)
      map.setPaintProperty(BOUNDARY_LINE_LAYER, 'line-color', linePaint['line-color'])
      map.setPaintProperty(BOUNDARY_LINE_LAYER, 'line-width', linePaint['line-width'])
      map.setPaintProperty(BOUNDARY_LINE_LAYER, 'line-opacity', linePaint['line-opacity'])
    }
  }, [map, isLoaded, boundaries, selectedId, reducedMotion])

  if (isError) throw new Error('Batas provinsi belum dapat dimuat.')
  return null
}
