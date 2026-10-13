import circle from '@turf/circle'
import { useMemo } from 'react'

import { MapGeoJSON, MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import { getMapPadding, LOCATION_ZOOM } from '@/lib/indonesia-view'
import { NEARBY_HOTSPOT_RADIUS_KM } from '@/lib/nearby'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { LOCATION_HEX, withAlpha } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

export function UserLocationLayer() {
  const location = useMapStore((s) => s.location)
  const { map } = useMap()
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()

  const circleData = useMemo(() => {
    if (location.status !== 'active' || !location.coords) return null
    const { lon, lat } = location.coords
    return circle([lon, lat], NEARBY_HOTSPOT_RADIUS_KM, {
      units: 'kilometers',
      steps: 64,
    })
  }, [location])

  if (location.status !== 'active' || !location.coords || !circleData) {
    return null
  }

  const { lon, lat } = location.coords

  return (
    <>
      <MapGeoJSON
        id="user-radius-25km"
        data={circleData}
        fillPaint={{
          'fill-color': LOCATION_HEX,
          'fill-opacity': 0.04,
        }}
        linePaint={{
          'line-color': withAlpha(LOCATION_HEX, 0.4),
          'line-width': 1,
          'line-dasharray': [2, 2],
        }}
      />
      <MapMarker
        longitude={lon}
        latitude={lat}
        anchor="center"
        className="user-location-marker z-30"
      >
        <MarkerContent className="relative flex items-center justify-center">
          <span
            aria-hidden
            className="bg-location-tint/80 absolute size-9 rounded-full opacity-60"
          />
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="border-surface bg-surface shadow-md relative flex size-5 cursor-pointer items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-110 active:scale-95"
                aria-label={copy.location.yourLocation}
                onClick={(event) => {
                  event.stopPropagation()
                  map?.flyTo({
                    center: [lon, lat],
                    zoom: LOCATION_ZOOM,
                    padding: getMapPadding(panelOpen),
                    duration: reducedMotion ? 0 : 600,
                  })
                  setPanelOpen(true)
                }}
              >
                <span className="bg-location size-3 rounded-full shadow-sm" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="rounded-card border-line/10 bg-ink text-surface z-50 flex w-56 flex-col items-start gap-1 p-2 text-xs shadow-md"
            >
              <span className="border-line/20 flex w-full items-center justify-between gap-2 border-b pb-1 font-medium">
                <span>{copy.location.yourLocation}</span>
                <span className="text-surface/70 font-mono text-xs">{copy.location.radiusBadge}</span>
              </span>
              <span className="text-surface/80">{copy.location.riskSubtitle}</span>
            </TooltipContent>
          </Tooltip>
        </MarkerContent>
      </MapMarker>
    </>
  )
}
