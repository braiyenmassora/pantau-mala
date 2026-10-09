import circle from '@turf/circle'
import { useMemo } from 'react'

import {
  MapGeoJSON,
  MapMarker,
  MarkerContent,
} from '@/components/ui/map'
import { NEARBY_HOTSPOT_RADIUS_KM } from '@/lib/nearby'
import { BRAND_HEX, withAlpha } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'

export function UserLocationLayer() {
  const location = useMapStore((s) => s.location)

  const circleData = useMemo(() => {
    if (location.status !== 'active' || !location.coords) return null
    const { lon, lat } = location.coords
    return circle([lon, lat], NEARBY_HOTSPOT_RADIUS_KM, {
      units: 'kilometers',
      steps: 64,
    })
  }, [location])

  const labelPos = useMemo((): [number, number] | null => {
    if (!circleData) return null
    const ring = circleData.geometry.coordinates[0]
    let best = ring[0] as [number, number]
    for (const c of ring) {
      if (c[1] > best[1]) best = c as [number, number]
    }
    return best
  }, [circleData])

  if (location.status !== 'active' || !location.coords || !circleData || !labelPos) {
    return null
  }

  const { lon, lat } = location.coords

  return (
    <>
      <MapGeoJSON
        id="user-radius-25km"
        data={circleData}
        fillPaint={{
          'fill-color': BRAND_HEX,
          'fill-opacity': 0.04,
        }}
        linePaint={{
          'line-color': withAlpha(BRAND_HEX, 0.4),
          'line-width': 1,
          'line-dasharray': [2, 2],
        }}
      />
      <MapMarker longitude={lon} latitude={lat} anchor="center">
        <MarkerContent className="relative z-[15] flex items-center justify-center">
          <span
            aria-hidden
            className="absolute size-10 rounded-full"
            style={{ backgroundColor: withAlpha(BRAND_HEX, 0.16) }}
          />
          <span
            className="relative size-4 rounded-full border-[3px] border-surface bg-brand shadow-map"
            aria-label="Lokasi kamu"
          />
        </MarkerContent>
      </MapMarker>
      <MapMarker longitude={labelPos[0]} latitude={labelPos[1]} anchor="center">
        <MarkerContent className="z-[15]">
          <span
            className="inline-flex h-6 items-center rounded-full border border-line bg-surface text-xs font-medium text-ink shadow-sm"
            style={{ paddingLeft: 10, paddingRight: 10 }}
          >
            Radius 25 km
          </span>
        </MarkerContent>
      </MapMarker>
    </>
  )
}
