import { focusRing } from '@/components/common/focus-ring'
import { MapMarker, MarkerContent } from '@/components/ui/map'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useEarthquakes } from '@/data/queries'
import { cn } from '@/lib/utils'

/**
 * Pembersih string lokasi BMKG agar ringkas dan padat (hilangkan boilerplate).
 */
function cleanWilayah(raw: string): string {
  return raw.replace(/^pusat\s+gempa\s+berada\s+di\s+/i, '').trim()
}

/**
 * Icon gelombang seismik (P-wave & S-wave shockwaves emanasi dari hiposenter).
 */
function SeismicWaveIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="2" fill="currentColor" stroke="none" />
      <path d="M13.5 6.5a5 5 0 0 1 0 7m-7 0a5 5 0 0 1 0-7" />
      <path d="M16 4a8.5 8.5 0 0 1 0 12m-12 0a8.5 8.5 0 0 1 0-12" />
    </svg>
  )
}

/**
 * Layer episentrum kegempaan BMKG (Seismic Surveillance Beacon).
 * Tampilan ringkas, bersih, dan enterprise tanpa teks boilerplate berlebihan.
 */
export function EarthquakeLayer() {
  const { data: earthquakes } = useEarthquakes('latest')
  const events = earthquakes?.data ?? []

  if (events.length === 0) return null

  return (
    <>
      {events.map((event, idx) => {
        const [lon, lat] = event.pusat
        const isStrong = event.magnitudo >= 5
        const lokasi = cleanWilayah(event.wilayah)

        return (
          <MapMarker key={`${lon}-${lat}-${idx}`} longitude={lon} latitude={lat} anchor="center">
            <MarkerContent className="relative z-20 flex items-center justify-center">
              {/* Gelombang kejut seismik (hairline shockwave ripple) */}
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute size-8 rounded-full border opacity-60',
                  isStrong ? 'border-risk-high animate-halo-high' : 'border-risk-mid animate-halo-mid',
                )}
              />

              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'border-line bg-surface shadow-map relative inline-flex items-center gap-1 rounded-full border px-2 py-1',
                      'origin-center transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95',
                      focusRing,
                      isStrong
                        ? 'border-risk-high bg-risk-high-tint text-risk-high'
                        : 'border-risk-mid bg-risk-mid-tint text-risk-mid',
                    )}
                    aria-label={`Gempa M${event.magnitudo.toFixed(1)}, ${lokasi}`}
                  >
                    <SeismicWaveIcon className="size-3.5 shrink-0" />
                    <span className="font-mono text-xs font-semibold tabular-nums text-ink">
                      M{event.magnitudo.toFixed(1)}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={8}
                  className="rounded-card border-line/10 bg-ink text-surface shadow-md z-50 flex w-60 flex-col items-start gap-1 p-2 text-xs"
                >
                  <div className="flex w-full items-center justify-between gap-2 border-b border-line/20 pb-1">
                    <span
                      className={cn(
                        'font-mono font-semibold text-xs tabular-nums',
                        isStrong ? 'text-risk-high' : 'text-risk-mid',
                      )}
                    >
                      Gempa M {event.magnitudo.toFixed(1)}
                    </span>
                    <span className="text-surface/80 font-mono text-xs">
                      {event.kedalaman_km} km
                    </span>
                  </div>
                  <p className="text-surface/90 text-xs leading-4">
                    {lokasi}
                  </p>
                </TooltipContent>
              </Tooltip>
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
