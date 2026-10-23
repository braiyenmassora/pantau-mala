import { Activity } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useMap } from '@/components/ui/map'
import { useEarthquakes } from '@/data/queries'
import { safeShakemap } from '@/lib/environment-data'
import { formatNumber } from '@/lib/format'
import { useMapStore } from '@/store/map'
import { cn } from '@/lib/utils'

function cleanWilayah(raw: string): string {
  return raw.replace(/^pusat\s+gempa\s+berada\s+di\s+/i, '').trim()
}

/** Episentrum BMKG: ikon Radio (beda dari titik risiko bulat). */
export function EarthquakeLayer() {
  const { map } = useMap()
  const showEarthquakes = useMapStore((s) => s.showEarthquakes)
  const earthquakeKind = useMapStore((s) => s.earthquakeKind)
  const earthquakeFocus = useMapStore((s) => s.earthquakeFocus)
  const sharedEarthquakeTime = useMapStore((s) => s.sharedEarthquakeTime)
  const focusEarthquake = useMapStore((s) => s.focusEarthquake)
  const { data: earthquakes } = useEarthquakes(earthquakeKind, showEarthquakes)
  const events = useMemo(() => earthquakes?.data ?? [], [earthquakes])
  const [hovered, setHovered] = useState<number | null>(null)
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null)

  const focusedTime = earthquakeFocus?.event.waktu

  useEffect(() => {
    if (!sharedEarthquakeTime) return
    const event = events.find((item) => item.waktu === sharedEarthquakeTime)
    if (event) focusEarthquake(event)
  }, [events, focusEarthquake, sharedEarthquakeTime])

  useEffect(() => {
    if (!map || !earthquakeFocus) return
    const [lon, lat] = earthquakeFocus.event.pusat
    map.flyTo({ center: [lon, lat], zoom: 7.5, duration: 1200 })
  }, [map, earthquakeFocus])

  if (!showEarthquakes || events.length === 0) return null

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
        const hazard = event.magnitudo >= 5 || Boolean(event.dirasakan)
        const open =
          hovered === idx ||
          inspectedIndex === idx ||
          (inspectedIndex === null && hovered === null && focusedTime === event.waktu)

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
                  'border-line bg-surface relative flex items-center justify-center rounded-full border shadow-sm transition-transform',
                  // Marker kejadian tunggal selalu 20px. Magnitudo memakai
                  // warna/ripple, bukan ukuran yang melonjak dari marker lain.
                  hazard ? 'text-risk-high size-5' : 'text-risk-mid size-5',
                  focusRing,
                  open && 'z-20 scale-110 ring-2 ring-emerald-600',
                )}
                aria-label={label}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(idx)}
                onBlur={() => setHovered(null)}
                onClick={() => {
                  setInspectedIndex((curr) => (curr === idx ? null : idx))
                  focusEarthquake(event)
                }}
              >
                {hazard ? <span className="earthquake-hazard-ring" aria-hidden /> : null}
                <Activity className="relative z-10 size-3" strokeWidth={2} aria-hidden />
              </button>

              {open ? (
                <div className="pointer-events-auto absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
                  <MapInfoCard
                    title={copy.map.quakeTitle(m)}
                    lines={[
                      lokasi,
                      `Kedalaman ${formatNumber(event.kedalaman_km)} km`,
                      event.potensi,
                      event.dirasakan ? `Dirasakan: ${event.dirasakan}` : '',
                      copy.map.quakeSource,
                    ].filter(Boolean)}
                  >
                    {event.shakemap && safeShakemap(event.shakemap) && (
                      <a
                        href={event.shakemap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand mt-1 block text-xs underline"
                      >
                        Buka Shakemap BMKG ↗
                      </a>
                    )}
                  </MapInfoCard>
                </div>
              ) : null}
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
