import { LocateFixed, Minus, Plus } from 'lucide-react'
import { useEffect, useState, type RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useMeta, useRegions } from '@/data/queries'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatRelativeAge } from '@/lib/format'
import { getMapPadding, LOCATION_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'
import { MapLayerControls } from '@/components/map/map-layer-controls'

type MapControlsProps = {
  mapRef: RefObject<MapRef | null>
}

export function MapControls({ mapRef }: MapControlsProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const { data: regions } = useRegions()
  const { data: meta } = useMeta()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const active = location.status === 'active' && location.coords

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  const updatedIso = meta?.updated_at ?? meta?.pulled_at.firms ?? meta?.pulled_at.weather
  const updatedLabel = updatedIso
    ? copy.updatedAt.stamp(formatRelativeAge(updatedIso, nowMs))
    : null

  return (
    <div
      data-testid="map-controls"
      className={cn(
        'map-controls absolute right-(--floating-control-offset) bottom-(--floating-control-offset) z-30 flex flex-col items-end gap-2',
        panelOpen && 'mobile-map-controls-panel-open max-sm:hidden',
      )}
      {...mapOverlayGestureProps}
    >
      <MapLayerControls mapRef={mapRef} regions={regions ?? []} />
      <div className="rounded-card border-line bg-surface divide-line flex flex-col divide-y overflow-hidden border shadow-sm backdrop-blur-sm">
        <button
          type="button"
          className={cn(
            'text-ink-2 hover:bg-surface-muted hover:text-ink flex size-11 shrink-0 items-center justify-center',
            'transition-[background-color,color] duration-150 ease-in-out',
            active && 'text-brand bg-brand-soft',
            focusRing,
          )}
          aria-label={active ? copy.map.recenter : copy.map.useMyLocation}
          aria-pressed={Boolean(active)}
          onClick={(e) => {
            if (active) {
              mapRef.current?.flyTo({
                center: [location.coords!.lon, location.coords!.lat],
                zoom: LOCATION_ZOOM,
                padding: getMapPadding(panelOpen),
                duration: reducedMotion ? 0 : 600,
              })
              // Jangan sekaligus memilih kabupaten: fit wilayah akan menimpa
              // flyTo lokasi pengguna dan tombol "lokasi saya" tampak gagal.
              return
            }
            rememberFocusTrigger(e.currentTarget)
            setLocation({ status: 'requesting' })
          }}
        >
          <LocateFixed className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        </button>

        <button
          type="button"
          className={cn(
            'mobile-zoom-control',
            'text-ink-2 hover:bg-surface-muted hover:text-ink flex size-11 shrink-0 items-center justify-center',
            'transition-[background-color,color] duration-150 ease-in-out',
            focusRing,
          )}
          aria-label={copy.map.zoomIn}
          onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
        >
          <Plus className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          className={cn(
            'mobile-zoom-control',
            'text-ink-2 hover:bg-surface-muted hover:text-ink flex size-11 shrink-0 items-center justify-center',
            'transition-[background-color,color] duration-150 ease-in-out',
            focusRing,
          )}
          aria-label={copy.map.zoomOut}
          onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
        >
          <Minus className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {updatedLabel ? (
        <p
          className="text-ink-2 bg-surface/90 rounded-ctl border-line pointer-events-none border px-2 py-1 text-xs leading-4 shadow-sm backdrop-blur-sm select-none"
          data-testid="map-updated-stamp"
        >
          {updatedLabel}
        </p>
      ) : null}
    </div>
  )
}
