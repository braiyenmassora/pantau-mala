import { useMemo } from 'react'

import { BeatWaveRadius } from '@/components/map/beat-wave-radius'
import { mapPinTip } from '@/components/map/map-pin-tip'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import { getMapPadding, LOCATION_ZOOM } from '@/lib/indonesia-view'
import { riskBeatMs } from '@/lib/map-beat'
import { NEARBY_HOTSPOT_RADIUS_KM } from '@/lib/nearby'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { LOCATION_HEX } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

/** Sama keluarga beat sedang — riak dari tepi radius, bukan dari pin. */
const LOCATION_BEAT_MS = riskBeatMs('sedang')

export function UserLocationLayer() {
  const location = useMapStore((s) => s.location)
  const { map } = useMap()
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()

  const showPin =
    (location.status === 'active' || location.status === 'outside') && !!location.coords
  const showRadius = location.status === 'active' && !!location.coords

  const center = useMemo((): [number, number] | null => {
    if (!location.coords) return null
    return [location.coords.lon, location.coords.lat]
  }, [location.coords])

  if (!showPin || !location.coords || !center) {
    return null
  }

  const { lon, lat } = location.coords
  const outside = location.status === 'outside'

  return (
    <>
      {showRadius ? (
        <BeatWaveRadius
          id="user-radius-25km"
          center={center}
          radiusKm={NEARBY_HOTSPOT_RADIUS_KM}
          color={LOCATION_HEX}
          periodMs={LOCATION_BEAT_MS}
          fillOpacity={0.06}
        />
      ) : null}
      <MapMarker
        longitude={lon}
        latitude={lat}
        anchor="center"
        className="user-location-marker z-30"
      >
        <MarkerContent className="relative flex items-center justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="border-surface bg-surface relative flex size-5 cursor-pointer items-center justify-center rounded-full border-2 shadow-md transition-transform duration-150 hover:scale-110 active:scale-95"
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
            <TooltipContent side="top" sideOffset={8} className={mapPinTip}>
              <span className="border-line flex w-full items-center justify-between gap-2 border-b pb-1.5">
                <span className="text-ink text-sm leading-5 font-semibold">
                  {copy.location.yourLocation}
                </span>
                {!outside ? (
                  <span className="text-ink-2 text-xs leading-4 tabular-nums">
                    {copy.location.radiusBadge}
                  </span>
                ) : null}
              </span>
              <span className="text-ink-2 text-xs leading-4">
                {outside ? copy.location.outsidePinNote : copy.location.riskSubtitle}
              </span>
            </TooltipContent>
          </Tooltip>
        </MarkerContent>
      </MapMarker>
    </>
  )
}
