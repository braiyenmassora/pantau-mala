import { useEffect, useMemo, useState } from 'react'
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl'

import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { TEMP_GRADIENT_STOPS, TEMP_HALO_HEX, TEMP_TEXT_HEX } from '@/lib/risk-category'
import { freshTemperatureRegions } from '@/lib/environment-data'
import { formatDateTime, formatNumber } from '@/lib/format'
import { useCurrentTime } from '@/lib/use-current-time'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const SOURCE_ID = 'open-meteo-temperature'
const LAYER_ID = 'open-meteo-temperature-layer'
const LABEL_LAYER_ID = 'open-meteo-temperature-label'

type TemperatureLayerProps = { regions: Region[] }

/**
 * Layer suhu udara (Open-Meteo).
 * Menggunakan satu warna hangat monokromatik (brand ember), bukan warna-warni pelangi.
 * Tetap terpisah dari titik panas satelit agar seluruh suhu dapat dibaca.
 */
export function TemperatureLayer({ regions }: TemperatureLayerProps) {
  const { map, isLoaded } = useMap()
  const enabled = useMapStore((s) => s.showTemperature)
  const now = useCurrentTime()
  const activeRegions = useMemo(() => freshTemperatureRegions(regions, now), [regions, now])
  const [inspectCode, setInspectCode] = useState<string | null>(null)
  const inspected = useMemo(() => activeRegions.find((r) => r.code === inspectCode), [activeRegions, inspectCode])
  const select = useMapStore((s) => s.select)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  const data = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: activeRegions.map((r) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: r.center,
          },
          properties: {
            code: r.code,
            name: r.name,
            temperature: r.weather.temp_c,
            label: `${Math.round(r.weather.temp_c!)}°C`,
          },
        })),
    }),
    [activeRegions],
  )

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data,
      })
    }

    if (!map.getLayer(LAYER_ID)) {
      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3,
            6,
            6,
            12,
            9,
            18,
            12,
            24,
          ],
          'circle-color': [
            'step', ['get', 'temperature'],
            TEMP_GRADIENT_STOPS[0], 25,
            TEMP_GRADIENT_STOPS[1], 28,
            TEMP_GRADIENT_STOPS[2], 31,
            TEMP_GRADIENT_STOPS[3], 34,
            TEMP_GRADIENT_STOPS[4]
          ],
          'circle-opacity': enabled ? 0.16 : 0,
          'circle-blur': 0.6,
          'circle-stroke-width': 0,
        },
      })
    }

    if (!map.getLayer(LABEL_LAYER_ID)) {
      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        minzoom: 5.5,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 11,
          'text-offset': [0, 0],
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': TEMP_TEXT_HEX,
          'text-halo-color': TEMP_HALO_HEX,
          'text-halo-width': 1.5,
          'text-opacity': enabled ? 0.85 : 0,
        },
      })
    }

    const onCircleClick = (e: MapLayerMouseEvent) => {
      const code = e.features?.[0]?.properties?.code as string | undefined
      if (!code) return
      setInspectCode(code)
      select(code)
      setPanelOpen(true)
    }

    map.on('click', LAYER_ID, onCircleClick)

    return () => {
      try {
        map.off('click', LAYER_ID, onCircleClick)
        if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID)
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // teardown
      }
    }
  }, [map, isLoaded, data, enabled, select, setPanelOpen])

  useEffect(() => {
    if (!map || !isLoaded) return
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    source?.setData(data)
    if (map.getLayer(LAYER_ID)) {
      map.setPaintProperty(LAYER_ID, 'circle-opacity', enabled ? 0.16 : 0)
    }
    if (map.getLayer(LABEL_LAYER_ID)) {
      map.setPaintProperty(LABEL_LAYER_ID, 'text-opacity', enabled ? 0.85 : 0)
    }
  }, [map, isLoaded, data, enabled])

  if (!enabled || !inspected || inspected.weather.temp_c == null) return null
  return (
    <MapMarker longitude={inspected.center[0]} latitude={inspected.center[1]} anchor="bottom">
      <MarkerContent className="pointer-events-auto">
        <div className="bg-surface border-line rounded-card relative mb-2 max-w-xs border p-3 text-xs shadow-md">
          <button type="button" onClick={() => setInspectCode(null)} className="text-ink-2 hover:text-ink absolute top-2 right-2 text-xs">✕</button>
          <p className="text-ink font-semibold">{inspected.name}</p>
          <p className="text-brand text-sm font-bold">{formatNumber(inspected.weather.temp_c)}°C · {inspected.weather.condition}</p>
          <p className="text-ink-2">Model Open-Meteo · Kelembapan {formatNumber(inspected.weather.humidity)}%</p>
          {inspected.weather_updated_at && <p className="text-ink-3">Observasi {formatDateTime(inspected.weather_updated_at, 'WIB')}</p>}
        </div>
      </MarkerContent>
    </MapMarker>
  )
}
