import { Crosshair, Minus, Plus, Wind } from 'lucide-react'
import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useHotspots, useRegions } from '@/data/queries'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { getMapPadding, LOCATION_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { resolveUserRegionCode } from '@/lib/resolve-user-region'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type MapControlsProps = {
  mapRef: RefObject<MapRef | null>
}

export function MapControls({ mapRef }: MapControlsProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const showWind = useMapStore((s) => s.showWind)
  const toggleWind = useMapStore((s) => s.toggleWind)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const { data: regions } = useRegions()
  const { data: hotspots } = useHotspots()
  const active = location.status === 'active' && location.coords

  return (
    <div
      data-testid="map-controls"
      className={cn(
        'absolute right-4 bottom-4 z-30 flex flex-col items-center gap-2',
        panelOpen && 'hidden sm:flex',
      )}
      {...mapOverlayGestureProps}
    >
      <button
        type="button"
        className={cn(
          'rounded-ctl border-line bg-surface text-ink-2 flex size-9 shrink-0 items-center justify-center border shadow-sm',
          'transition-[background-color,color,border-color] duration-150 ease-in-out',
          'hover:bg-surface-muted hover:text-ink',
          showWind && 'border-brand text-brand bg-brand-soft shadow-sm',
          focusRing,
        )}
        aria-label={copy.map.toggleWind}
        aria-pressed={showWind}
        onClick={toggleWind}
      >
        <Wind className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      </button>

      <button
        type="button"
        className={cn(
          'rounded-ctl border-line bg-surface text-ink-2 flex size-9 shrink-0 items-center justify-center border shadow-sm',
          'transition-[background-color,color,border-color] duration-150 ease-in-out',
          'hover:bg-surface-muted hover:text-ink',
          active && 'border-brand text-brand bg-brand-soft shadow-sm',
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
            if (regions && hotspots) {
              const code = resolveUserRegionCode(
                location.coords!,
                regions,
                hotspots.features,
              )
              if (code) {
                select(code)
                setPanelOpen(true)
              }
            }
            return
          }
          rememberFocusTrigger(e.currentTarget)
          setLocation({ status: 'requesting' })
        }}
      >
        <Crosshair className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      </button>

      <div className="rounded-ctl border-line bg-surface flex flex-col overflow-hidden border shadow-sm">
        <button
          type="button"
          className={cn(
            'border-line text-ink-2 hover:bg-surface-muted hover:text-ink flex size-9 shrink-0 items-center justify-center border-b',
            'transition-[background-color,color] duration-150 ease-in-out',
            focusRing,
          )}
          aria-label={copy.map.zoomIn}
          onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
        >
          <Plus className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          className={cn(
            'text-ink-2 hover:bg-surface-muted hover:text-ink flex size-9 shrink-0 items-center justify-center',
            'transition-[background-color,color] duration-150 ease-in-out',
            focusRing,
          )}
          aria-label={copy.map.zoomOut}
          onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
        >
          <Minus className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  )
}
