import { Activity } from 'lucide-react'
import { useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useEarthquakes } from '@/data/queries'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

function cleanWilayah(raw: string): string {
  return raw.replace(/^pusat\s+gempa\s+berada\s+di\s+/i, '').trim()
}

/** Episentrum: Activity (seismograf) — beda dari pin risiko bulat & lokasi. */
export function EarthquakeLayer() {
  const { data: earthquakes } = useEarthquakes('latest')
  const events = earthquakes?.data ?? []
  const [hovered, setHovered] = useState<number | null>(null)

  if (events.length === 0) return null

  return (
    <>
      {events.map((event, idx) => {
        const [lon, lat] = event.pusat
        const lokasi = cleanWilayah(event.wilayah)
        const m = formatNumber(event.magnitudo, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
        const label = `${copy.map.quakeTitle(m)}, ${lokasi}`

        return (
          <MapMarker
            key={`${lon}-${lat}-${idx}`}
            longitude={lon}
            latitude={lat}
            anchor="center"
          >
            <MarkerContent className="relative z-20 flex items-center justify-center overflow-visible">
              <button
                type="button"
                className={cn(
                  'marker--quake marker--interactive border-line bg-surface text-risk-mid shadow-chrome relative flex size-7 items-center justify-center rounded-full border',
                  focusRing,
                  hovered === idx && 'z-20',
                )}
                aria-label={label}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(idx)}
                onBlur={() => setHovered(null)}
              >
                <Activity
                  className="marker--quake-icon size-3.5"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>

              {hovered === idx ? (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
                  <MapInfoCard
                    title={copy.map.quakeTitle(m)}
                    lines={[lokasi, `Kedalaman ${formatNumber(event.kedalaman_km)} km`]}
                  />
                </div>
              ) : null}
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
