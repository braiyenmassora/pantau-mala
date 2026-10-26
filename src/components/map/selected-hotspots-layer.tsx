import circle from '@turf/circle'
import distance from '@turf/distance'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FeatureCollection, Polygon } from 'geojson'
import type { GeoJSONSource } from 'maplibre-gl'

import { BeatWaveRadius } from '@/components/map/beat-wave-radius'
import {
  HotspotDetailCard,
  type HotspotDetailRow,
} from '@/components/map/hotspot-detail-card'
import { pinTipMapOffsetY } from '@/components/map/map-pin-tip'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { getCopy } from '@/copy'
import { pointKey, useReportCounts } from '@/data/hotspot-reports'
import { useHotspots } from '@/data/queries'
import type { ConfidenceLevel, HotspotFeature, Region } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatDateDotTime, formatDateTime } from '@/lib/format'
import { getMapPadding } from '@/lib/indonesia-view'
import { pinPulseStyle, riskBeatMs } from '@/lib/map-beat'
import { MAP_COLORS } from '@/lib/map-colors'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const MASK_SOURCE_ID = 'selected-region-mask-source'
const MASK_FILL_LAYER = 'selected-region-mask-fill'

type SelectedHotspotsLayerProps = {
  regions: Region[]
}

// ponytail: fit-bounds sekali per kabupaten; mask setData tanpa removeLayer tiap update.
export function SelectedHotspotsLayer({ regions }: SelectedHotspotsLayerProps) {
  const { map, isLoaded } = useMap()
  const selectedCode = useMapStore((s) => s.selectedCode)
  const focusHotspotTime = useMapStore((s) => s.focusHotspotTime)
  const clearFocusHotspotTime = useMapStore((s) => s.clearFocusHotspotTime)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const { data } = useHotspots()
  const lastFitCode = useRef<string | null>(null)
  /** Tip atribut lengkap — hanya saat pin diklik. */
  const [selectedPin, setSelectedPin] = useState<number | null>(null)
  const setReportTarget = useUiStore((s) => s.setReportTarget)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  // Ganti wilayah → tutup tip (adjust state saat prop berubah — bukan effect).
  const [pinScope, setPinScope] = useState(selectedCode)
  if (pinScope !== selectedCode) {
    setPinScope(selectedCode)
    setSelectedPin(null)
  }

  const selectedRegion = useMemo(
    () => regions.find((r) => r.code === selectedCode),
    [regions, selectedCode],
  )

  const regionHotspots = useMemo(() => {
    if (!selectedCode || !data) return []
    return data.features.filter((f) => f.properties.region_code === selectedCode)
  }, [selectedCode, data])

  // Klik titik heatmap → buka tip; bersihkan flag fokus di effect (store eksternal).
  const focusIndex =
    focusHotspotTime == null
      ? -1
      : regionHotspots.findIndex((f) => f.properties.time === focusHotspotTime)
  if (focusIndex >= 0 && selectedPin !== focusIndex) {
    setSelectedPin(focusIndex)
  }
  useEffect(() => {
    if (focusHotspotTime == null || focusIndex < 0) return
    clearFocusHotspotTime()
  }, [focusHotspotTime, focusIndex, clearFocusHotspotTime])

  const countPoints = useMemo(
    () =>
      regionHotspots.map((f) => {
        const [lon, lat] = f.geometry.coordinates
        return { lat, lon }
      }),
    [regionHotspots],
  )
  const { data: reportCounts } = useReportCounts(countPoints)

  // Tip di atas pin: canvas mobile pendek (di atas sheet) — pan supaya tip tidak kepotong.
  useEffect(() => {
    if (selectedPin == null || !map) return
    const f = regionHotspots[selectedPin]
    if (!f) return
    const [lon, lat] = f.geometry.coordinates
    const pad = getMapPadding(panelOpen)
    const top = typeof pad.top === 'number' ? pad.top : 72
    const offsetY = pinTipMapOffsetY(map.getContainer().clientHeight, 300, top)
    if (offsetY === 0) return
    map.easeTo({ center: [lon, lat], offset: [0, offsetY], duration: 280 })
  }, [selectedPin, map, regionHotspots, panelOpen])

  const focus = useMemo(() => {
    if (!selectedRegion) return null
    let minLon = selectedRegion.center[0]
    let maxLon = selectedRegion.center[0]
    let minLat = selectedRegion.center[1]
    let maxLat = selectedRegion.center[1]

    for (const f of regionHotspots) {
      const [lon, lat] = f.geometry.coordinates
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }

    const pad = 0.12
    const bounds = {
      minLon: minLon - pad,
      maxLon: maxLon + pad,
      minLat: minLat - pad,
      maxLat: maxLat + pad,
    }
    const center: [number, number] = [
      (bounds.minLon + bounds.maxLon) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ]
    const radiusKm = Math.max(
      distance(center, [bounds.minLon, bounds.minLat], { units: 'kilometers' }),
      distance(center, [bounds.maxLon, bounds.minLat], { units: 'kilometers' }),
      distance(center, [bounds.maxLon, bounds.maxLat], { units: 'kilometers' }),
      distance(center, [bounds.minLon, bounds.maxLat], { units: 'kilometers' }),
    )
    return { bounds, center, radiusKm }
  }, [selectedRegion, regionHotspots])

  // Fit bounds hanya saat ganti kabupaten terpilih
  useEffect(() => {
    if (!map || !focus || !selectedCode) {
      lastFitCode.current = null
      return
    }
    if (lastFitCode.current === selectedCode) return
    lastFitCode.current = selectedCode
    map.fitBounds(
      [
        [focus.bounds.minLon, focus.bounds.minLat],
        [focus.bounds.maxLon, focus.bounds.maxLat],
      ],
      {
        padding: getMapPadding(panelOpen),
        duration: 600,
        maxZoom: 11,
      },
    )
    // shortcut: panelOpen tidak di-deps — menghindari fit ulang tiap toggle panel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedCode, focus])

  // Mask: setData saja; remove hanya saat unmount / tidak ada focus
  useEffect(() => {
    if (!map || !isLoaded) return

    if (!focus) {
      try {
        if (map.getLayer(MASK_FILL_LAYER)) map.removeLayer(MASK_FILL_LAYER)
        if (map.getSource(MASK_SOURCE_ID)) map.removeSource(MASK_SOURCE_ID)
      } catch {
        // cleanup
      }
      return
    }

    const hole = circle(focus.center, focus.radiusKm, {
      units: 'kilometers',
      steps: 64,
    })
    const holeRing = hole.geometry.coordinates[0]

    const maskGeoJson: FeatureCollection<Polygon> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-180, -85],
                [180, -85],
                [180, 85],
                [-180, 85],
                [-180, -85],
              ],
              [...holeRing].reverse(),
            ],
          },
          properties: {},
        },
      ],
    }

    if (!map.getSource(MASK_SOURCE_ID)) {
      map.addSource(MASK_SOURCE_ID, {
        type: 'geojson',
        data: maskGeoJson,
      })
    } else {
      const src = map.getSource(MASK_SOURCE_ID) as GeoJSONSource | undefined
      src?.setData(maskGeoJson)
    }

    if (!map.getLayer(MASK_FILL_LAYER)) {
      map.addLayer({
        id: MASK_FILL_LAYER,
        type: 'fill',
        source: MASK_SOURCE_ID,
        paint: {
          'fill-color': MAP_COLORS.surface,
          'fill-opacity': 0.4,
        },
      })
    }
  }, [map, isLoaded, focus])

  // Teardown mask hanya saat komponen unmount
  useEffect(() => {
    if (!map) return
    return () => {
      try {
        if (map.getLayer(MASK_FILL_LAYER)) map.removeLayer(MASK_FILL_LAYER)
        if (map.getSource(MASK_SOURCE_ID)) map.removeSource(MASK_SOURCE_ID)
      } catch {
        // teardown
      }
    }
  }, [map])

  const risk = selectedRegion ? effectiveRiskCategory(selectedRegion) : 'tidak_tersedia'
  const style = RISK_CATEGORIES[risk]

  if (!selectedRegion) return null

  const pulseStyle = pinPulseStyle(risk, style.dot)

  function detailRows(f: HotspotFeature): HotspotDetailRow[] {
    const copy = getCopy().hotspotDetail
    return [
      {
        label: copy.date,
        value: formatDateTime(f.properties.time, selectedRegion!.time_zone),
      },
      { label: copy.source, value: f.properties.satellite },
      {
        label: copy.confidence,
        value: copy.confidenceValue[f.properties.confidence as ConfidenceLevel],
      },
      { label: copy.regency, value: selectedRegion!.name },
      { label: copy.province, value: selectedRegion!.province },
    ]
  }

  return (
    <>
      {focus ? (
        <BeatWaveRadius
          id="selected-region-radius"
          center={focus.center}
          radiusKm={focus.radiusKm}
          color={style.dot}
          periodMs={riskBeatMs(risk)}
          fillOpacity={0.06}
        />
      ) : null}

      {regionHotspots.map((f, i) => {
        const [lon, lat] = f.geometry.coordinates
        const stamp = formatDateDotTime(f.properties.time, selectedRegion.time_zone)
        const reportCount = reportCounts?.get(pointKey(lat, lon)) ?? 0
        const label =
          reportCount > 0
            ? `${getCopy().extra.detections} ${stamp}, ${getCopy().report.badge(String(reportCount))}`
            : `${getCopy().extra.detections} ${stamp}`

        return (
          <MapMarker
            key={`${f.properties.time}-${lon}-${lat}-${i}`}
            longitude={lon}
            latitude={lat}
            anchor="center"
          >
            <MarkerContent
              // Tip di atas pin tetangga — z pada elemen MapLibre marker.
              zIndex={selectedPin === i ? 40 : undefined}
              className="relative flex items-center justify-center overflow-visible"
            >
              <div className="relative flex items-center justify-center">
                {selectedPin === i ? (
                  <div
                    className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <HotspotDetailCard
                      rows={detailRows(f)}
                      onClose={() => setSelectedPin(null)}
                      onWriteReport={(el) => {
                        rememberFocusTrigger(el)
                        setReportTarget({
                          lat,
                          lon,
                          region_code: f.properties.region_code,
                          hotspot_time: f.properties.time,
                        })
                        setPanelOpen(true)
                        setSelectedPin(null)
                      }}
                    />
                  </div>
                ) : null}
                {reportCount > 0 ? (
                  <span
                    className="bg-brand text-surface shadow-map absolute -top-3 -right-3 z-20 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs leading-none font-semibold"
                    aria-hidden
                  >
                    {reportCount}
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label={`${label}. ${getCopy().map.openHotspotDetail}`}
                  aria-expanded={selectedPin === i}
                  className={cn(
                    // Area ketuk lebih besar dari titik visual (mobile).
                    'marker--interactive marker--pulse border-surface shadow-map relative size-5 cursor-pointer rounded-full border-2',
                    'after:absolute after:-inset-3 after:content-[""]',
                  )}
                  style={{ backgroundColor: style.dot, ...pulseStyle }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPin((cur) => (cur === i ? null : i))
                  }}
                />
              </div>
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
