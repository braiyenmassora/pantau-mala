import { useEffect, useMemo, useRef, useState } from 'react'

import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useHotspotReportCounts } from '@/data/hotspot-reports'
import { useHotspots } from '@/data/queries'
import type { Region } from '@/data/types'
import { formatDateTime, formatNumber } from '@/lib/format'
import { getMapPadding } from '@/lib/indonesia-view'
import { HOTSPOT_HEX } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type SelectedHotspotsLayerProps = {
  regions: Region[]
}

// A selected region is a map focus, not a measured impact radius. Keep the
// useful bounds transition but never draw a circular mask that suggests one.
export function SelectedHotspotsLayer({ regions }: SelectedHotspotsLayerProps) {
  const { map } = useMap()
  const selectedCode = useMapStore((s) => s.selectedCode)
  const selectHotspot = useMapStore((s) => s.selectHotspot)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data } = useHotspots(Boolean(selectedCode), { regionCode: selectedCode })
  const lastFitCode = useRef<string | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  const selectedRegion = useMemo(
    () => regions.find((r) => r.code === selectedCode),
    [regions, selectedCode],
  )

  const regionHotspots = useMemo(() => {
    if (!selectedCode || !data) return []
    return data.features.filter((f) => f.properties.region_code === selectedCode)
  }, [selectedCode, data])
  const reportCounts = useHotspotReportCounts(
    regionHotspots.map((feature) => ({
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
    })),
    regionHotspots.length > 0 && regionHotspots.length <= 64,
  )
  const countByPoint = useMemo(
    () =>
      new Map(
        (reportCounts.data ?? []).map((item) => [
          `${item.point_lat.toFixed(5)},${item.point_lon.toFixed(5)}`,
          item.count,
        ]),
      ),
    [reportCounts.data],
  )

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
    return { bounds }
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

  if (!selectedRegion || regionHotspots.length === 0 || regionHotspots.length > 64)
    return null

  return (
    <>
      {regionHotspots.map((f, i) => {
        const [lon, lat] = f.geometry.coordinates
        const stamp = formatDateTime(f.properties.time, selectedRegion.time_zone)
        const count = countByPoint.get(`${lat.toFixed(5)},${lon.toFixed(5)}`) ?? 0
        const label = `Titik panas ${stamp} · FRP ${formatNumber(f.properties.frp_mw)} MW · ${count} laporan warga`

        return (
          <MapMarker
            key={`${f.properties.time}-${lon}-${lat}-${i}`}
            longitude={lon}
            latitude={lat}
            anchor="center"
          >
            <MarkerContent className="relative flex items-center justify-center overflow-visible">
              {hovered === i ? (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
                  <MapInfoCard
                    title={copy.extra.detections}
                    lines={[
                      selectedRegion.name,
                      `Terdeteksi ${stamp}`,
                      `FRP ${formatNumber(f.properties.frp_mw)} MW`,
                    ]}
                  />
                </div>
              ) : null}
              <button
                type="button"
                aria-label={label}
                className={cn(
                  'group relative flex size-8 cursor-pointer items-center justify-center rounded-full',
                  'focus-visible:ring-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                )}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                onClick={(event) => {
                  event.stopPropagation()
                  selectHotspot(selectedRegion.code, selectedRegion.province, {
                    lat,
                    lon,
                    time: f.properties.time,
                    frpMw: f.properties.frp_mw,
                    satellite: f.properties.satellite,
                  })
                  setPanelOpen(true)
                }}
              >
                <span
                  className="border-surface size-3.5 rounded-full border-2 shadow-sm transition-transform duration-150 group-hover:scale-110"
                  style={{ backgroundColor: HOTSPOT_HEX }}
                  aria-hidden
                />
                {count > 0 ? (
                  <span className="bg-ink text-surface absolute top-0 right-0 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-xs font-semibold shadow-sm">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </button>
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
