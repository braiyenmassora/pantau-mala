import { focusRing } from '@/components/common/focus-ring'
import { mapPinTip } from '@/components/map/map-pin-tip'
import { MapMarker, MarkerContent } from '@/components/ui/map'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useEarthquakes } from '@/data/queries'
import { cn } from '@/lib/utils'

function cleanWilayah(raw: string): string {
  return raw.replace(/^pusat\s+gempa\s+berada\s+di\s+/i, '').trim()
}

/** Episentrum BMKG: titik bulat oranye seragam. */
export function EarthquakeLayer() {
  const { data: earthquakes } = useEarthquakes('latest')
  const events = earthquakes?.data ?? []

  if (events.length === 0) return null

  return (
    <>
      {events.map((event, idx) => {
        const [lon, lat] = event.pusat
        const lokasi = cleanWilayah(event.wilayah)
        const m = event.magnitudo.toFixed(1)

        return (
          <MapMarker key={`${lon}-${lat}-${idx}`} longitude={lon} latitude={lat} anchor="center">
            <MarkerContent className="relative z-20 flex items-center justify-center overflow-visible">
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'border-surface shadow-map relative size-2.5 rounded-full border-2 bg-brand-mala',
                      focusRing,
                    )}
                    aria-label={`Gempa M${m}, ${lokasi}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className={mapPinTip}>
                  <span className="text-ink font-semibold">
                    Gempa M{m} · {lokasi}
                  </span>
                </TooltipContent>
              </Tooltip>
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
