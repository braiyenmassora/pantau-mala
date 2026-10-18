import circle from '@turf/circle'
import { useEffect, useMemo, useState } from 'react'

import { MapGeoJSON } from '@/components/ui/map'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'

type BeatWaveRadiusProps = {
  id: string
  center: [number, number]
  radiusKm: number
  color: string
  /** Periode satu gelombang (sama keluarga --beat pin). */
  periodMs: number
  /** Fill dasar diam — riak satu ring soft di tepi. */
  fillOpacity?: number
}

/**
 * Radius + satu riak soft dari tepi ke luar (bukan double ring).
 */
export function BeatWaveRadius({
  id,
  center,
  radiusKm,
  color,
  periodMs,
  fillOpacity = 0.05,
}: BeatWaveRadiusProps) {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (reduced) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      setPhase(((now - t0) % periodMs) / periodMs)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, periodMs])

  const base = useMemo(
    () =>
      circle(center, radiusKm, {
        units: 'kilometers',
        steps: 64,
      }),
    [center, radiusKm],
  )

  // Satu gelombang dari tepi: R → 1.22R, warna penuh lalu pudar (tanpa garis dasar ganda).
  const beat = reduced ? 0 : phase
  const ease = 1 - (1 - beat) * (1 - beat)
  const waveRadiusKm = radiusKm * (1 + 0.22 * ease)
  const waveOpacity = reduced ? 0.7 : 1 - ease

  const wave = useMemo(
    () =>
      circle(center, waveRadiusKm, {
        units: 'kilometers',
        steps: 64,
      }),
    [center, waveRadiusKm],
  )

  return (
    <>
      <MapGeoJSON
        id={`${id}-base`}
        data={base}
        fillPaint={{
          'fill-color': color,
          'fill-opacity': fillOpacity,
        }}
        linePaint={false}
      />
      <MapGeoJSON
        id={`${id}-wave`}
        data={wave}
        fillPaint={false}
        linePaint={{
          'line-color': color,
          'line-opacity': waveOpacity,
          'line-width': 2,
        }}
      />
    </>
  )
}
