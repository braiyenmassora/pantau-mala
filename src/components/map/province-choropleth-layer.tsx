import { useEffect, useMemo, useRef, useState } from 'react'
import type { FeatureCollection } from 'geojson'
import type {
  FillLayerSpecification,
  GeoJSONSource,
  LineLayerSpecification,
  MapLayerMouseEvent,
} from 'maplibre-gl'

import { useMap } from '@/components/ui/map'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { getMapPadding } from '@/lib/indonesia-view'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const SOURCE_ID = 'province-choropleth-source'
const FILL_LAYER = 'province-choropleth-fill'
const LINE_LAYER = 'province-choropleth-line'

function matchProvince(name: string): string {
  const norm = name
    .toUpperCase()
    .replace(/^DI\.\s*/, '')
    .replace(/^PRO/, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (norm.startsWith('PAPUA')) {
    if (norm.includes('BARAT')) return 'PAPUA BARAT'
    return 'PAPUA'
  }
  if (norm.includes('YOGYAKARTA')) return 'DAERAH ISTIMEWA YOGYAKARTA'
  if (norm.includes('BANGKA')) return 'BANGKA BELITUNG'
  if (norm.includes('ACEH')) return 'DI. ACEH'
  return norm
}

function buildFillPaint(
  isNational: boolean,
  matchedProvince: string,
): FillLayerSpecification['paint'] {
  return (
    isNational
      ? {
          'fill-color': ['get', 'riskColor'],
          'fill-opacity': ['case', ['>', ['get', 'hotspots'], 0], 0.3, 0],
        }
      : {
          'fill-color': [
            'case',
            ['==', ['get', 'matched'], matchedProvince],
            ['get', 'riskColor'],
            '#FFFFFF',
          ],
          'fill-opacity': ['case', ['==', ['get', 'matched'], matchedProvince], 0.3, 0.4],
        }
  ) as FillLayerSpecification['paint']
}

function buildLinePaint(
  isNational: boolean,
  matchedProvince: string,
  hoveredMatched: string | null,
): LineLayerSpecification['paint'] {
  return (
    isNational
      ? {
          'line-color': '#FFFFFF',
          'line-width': ['case', ['==', ['get', 'matched'], hoveredMatched ?? ''], 2, 1],
          'line-opacity': [
            'case',
            ['==', ['get', 'matched'], hoveredMatched ?? ''],
            1,
            0.8,
          ],
        }
      : {
          'line-color': [
            'case',
            ['==', ['get', 'matched'], matchedProvince],
            ['get', 'riskColor'],
            '#FFFFFF',
          ],
          'line-width': [
            'case',
            ['==', ['get', 'matched'], matchedProvince],
            hoveredMatched === matchedProvince ? 2 : 1.5,
            1,
          ],
          'line-opacity': [
            'case',
            ['==', ['get', 'matched'], matchedProvince],
            hoveredMatched === matchedProvince ? 1 : 0.7,
            0.8,
          ],
        }
  ) as LineLayerSpecification['paint']
}

type ProvinceChoroplethLayerProps = {
  regions: Region[]
}

// ponytail: choropleth batas provinsi; paint/data di-update tanpa removeLayer (hindari kedip).
export function ProvinceChoroplethLayer({ regions }: ProvinceChoroplethLayerProps) {
  const { map, isLoaded } = useMap()
  const { data: catalog } = useRegionCatalog()
  const province = useMapStore((s) => s.province)
  const setProvince = useMapStore((s) => s.setProvince)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null)
  const hoveredRef = useRef<string | null>(null)
  const fittedProvinceRef = useRef<string | null>(null)
  const catalogRef = useRef(catalog)
  const setProvinceRef = useRef(setProvince)
  const provinceRef = useRef(province)

  useEffect(() => {
    catalogRef.current = catalog
    setProvinceRef.current = setProvince
    provinceRef.current = province
  }, [catalog, setProvince, province])

  useEffect(() => {
    let cancelled = false
    void fetch('/data/indonesia-provinces.geojson')
      .then((res) => res.json())
      .then((data: FeatureCollection) => {
        if (!cancelled) setGeoData(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const enrichedData = useMemo(() => {
    if (!geoData) return null
    const counts = new Map<string, number>()
    for (const r of regions) {
      const p = matchProvince(r.province)
      counts.set(p, (counts.get(p) ?? 0) + r.hotspots_24h)
    }

    return {
      type: 'FeatureCollection' as const,
      features: geoData.features.map((f) => {
        const prov = String(f.properties?.Propinsi ?? '').trim()
        const matched = matchProvince(prov)
        const hotspots = counts.get(matched) ?? counts.get(prov) ?? 0
        let riskColor = RISK_CATEGORIES.rendah.dot
        if (hotspots >= 10) riskColor = RISK_CATEGORIES.sangat_tinggi.dot
        else if (hotspots >= 1) riskColor = RISK_CATEGORIES.sedang.dot

        return {
          ...f,
          properties: {
            ...f.properties,
            hotspots,
            matched,
            riskColor,
          },
        }
      }),
    }
  }, [geoData, regions])

  // Fit bounds sekali per pilihan provinsi — bukan tiap refresh regions
  useEffect(() => {
    if (!map || !enrichedData || province === 'Semua') {
      if (province === 'Semua') fittedProvinceRef.current = null
      return
    }
    if (fittedProvinceRef.current === province) return

    const selectedFeature = enrichedData.features.find(
      (f) => f.properties.matched === matchProvince(province),
    )
    if (!selectedFeature) return

    let minLon = 180
    let maxLon = -180
    let minLat = 90
    let maxLat = -90

    const geom = selectedFeature.geometry
    const rings =
      geom.type === 'Polygon'
        ? geom.coordinates
        : geom.type === 'MultiPolygon'
          ? geom.coordinates.flat(1)
          : []

    for (const ring of rings) {
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }
    }

    if (minLon < maxLon && minLat < maxLat) {
      fittedProvinceRef.current = province
      map.fitBounds(
        [
          [minLon, minLat],
          [maxLon, maxLat],
        ],
        {
          padding: getMapPadding(panelOpen),
          duration: 600,
        },
      )
    }
    // shortcut: panelOpen tidak di-deps — hindari kamera loncat tiap toggle panel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, province, enrichedData])

  // Pasang source/layer + handler sekali; teardown hanya unmount
  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
    }

    if (!map.getLayer(FILL_LAYER)) {
      map.addLayer(
        {
          id: FILL_LAYER,
          type: 'fill',
          source: SOURCE_ID,
          paint: buildFillPaint(true, ''),
        },
        'tunnel_service_case',
      )
    }

    if (!map.getLayer(LINE_LAYER)) {
      map.addLayer(
        {
          id: LINE_LAYER,
          type: 'line',
          source: SOURCE_ID,
          layout: { 'line-join': 'round' },
          paint: buildLinePaint(true, '', null),
        },
        'tunnel_service_case',
      )
    }

    const applyLineHover = (hovered: string | null) => {
      if (!map.getLayer(LINE_LAYER)) return
      const matchedProvince = matchProvince(provinceRef.current)
      const isNational = provinceRef.current === 'Semua'
      const linePaint = buildLinePaint(isNational, matchedProvince, hovered)
      for (const [key, value] of Object.entries(linePaint ?? {})) {
        map.setPaintProperty(
          LINE_LAYER,
          key as keyof NonNullable<LineLayerSpecification['paint']>,
          value,
        )
      }
    }

    const onClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) return
      const provProp = String(feature.properties?.Propinsi ?? '')
      const target = catalogRef.current?.provinces.find(
        (p) => matchProvince(p.name) === matchProvince(provProp),
      )
      if (target) setProvinceRef.current(target.name)
    }

    const onEnter = (e: MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer'
      const feature = e.features?.[0]
      if (!feature) return
      const next = matchProvince(String(feature.properties?.Propinsi ?? ''))
      if (hoveredRef.current === next) return
      hoveredRef.current = next
      applyLineHover(next)
    }

    const onMove = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) return
      const next = matchProvince(String(feature.properties?.Propinsi ?? ''))
      if (hoveredRef.current === next) return
      hoveredRef.current = next
      applyLineHover(next)
    }

    const onLeave = () => {
      map.getCanvas().style.cursor = ''
      if (hoveredRef.current === null) return
      hoveredRef.current = null
      applyLineHover(null)
    }

    map.on('click', FILL_LAYER, onClick)
    map.on('mouseenter', FILL_LAYER, onEnter)
    map.on('mousemove', FILL_LAYER, onMove)
    map.on('mouseleave', FILL_LAYER, onLeave)

    return () => {
      try {
        map.off('click', FILL_LAYER, onClick)
        map.off('mouseenter', FILL_LAYER, onEnter)
        map.off('mousemove', FILL_LAYER, onMove)
        map.off('mouseleave', FILL_LAYER, onLeave)
        if (map.getLayer(LINE_LAYER)) map.removeLayer(LINE_LAYER)
        if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // teardown
      }
    }
  }, [map, isLoaded])

  // Update data + paint tanpa removeLayer
  useEffect(() => {
    if (!map || !isLoaded || !enrichedData) return
    if (
      !map.getSource(SOURCE_ID) ||
      !map.getLayer(FILL_LAYER) ||
      !map.getLayer(LINE_LAYER)
    ) {
      return
    }

    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    src?.setData(enrichedData)

    const matchedProvince = matchProvince(province)
    const isNational = province === 'Semua'
    const fillPaint = buildFillPaint(isNational, matchedProvince)
    const linePaint = buildLinePaint(isNational, matchedProvince, hoveredRef.current)

    for (const [key, value] of Object.entries(fillPaint ?? {})) {
      map.setPaintProperty(
        FILL_LAYER,
        key as keyof NonNullable<FillLayerSpecification['paint']>,
        value,
      )
    }
    for (const [key, value] of Object.entries(linePaint ?? {})) {
      map.setPaintProperty(
        LINE_LAYER,
        key as keyof NonNullable<LineLayerSpecification['paint']>,
        value,
      )
    }
  }, [map, isLoaded, enrichedData, province])

  return null
}
