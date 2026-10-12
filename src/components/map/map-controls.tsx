import { Crosshair, Minus, Plus } from 'lucide-react'
import type { RefObject } from 'react'

import { IconButton } from '@/components/common/icon-button'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useHotspots, useRegions } from '@/data/queries'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
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
        'absolute right-4 bottom-12 z-30 flex flex-col gap-2',
        panelOpen && 'hidden sm:flex',
      )}
      {...mapOverlayGestureProps}
    >
      <IconButton
        shape="square"
        className={cn(active && 'text-brand')}
        aria-label={active ? copy.map.recenter : copy.map.useMyLocation}
        aria-pressed={Boolean(active)}
        onClick={(e) => {
          if (active) {
            mapRef.current?.flyTo({
              center: [location.coords!.lon, location.coords!.lat],
              zoom: PLACE_ZOOM,
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
        <Crosshair className="size-5" strokeWidth={2} aria-hidden />
      </IconButton>
      <IconButton
        shape="square"
        aria-label={copy.map.zoomIn}
        onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
      >
        <Plus className="size-5" strokeWidth={2} aria-hidden />
      </IconButton>
      <IconButton
        shape="square"
        aria-label={copy.map.zoomOut}
        onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
      >
        <Minus className="size-5" strokeWidth={2} aria-hidden />
      </IconButton>
    </div>
  )
}
