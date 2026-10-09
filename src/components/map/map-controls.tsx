import { Crosshair, Minus, Plus } from 'lucide-react'
import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type MapControlsProps = {
  mapRef: RefObject<MapRef | null>
}

const btnClass = cn(
  'flex size-10 items-center justify-center rounded-ctl border border-line bg-surface text-ink shadow-sm',
  'transition-[background-color,color] duration-150 ease-in-out hover:bg-surface-muted',
  focusRing,
)

export function MapControls({ mapRef }: MapControlsProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const active = location.status === 'active' && location.coords

  return (
    <div
      className="absolute right-4 bottom-12 z-30 flex flex-col gap-2"
      {...mapOverlayGestureProps}
    >
      <button
        type="button"
        className={cn(btnClass, active && 'text-brand')}
        aria-label={active ? 'Pusatkan ke lokasi kamu' : 'Gunakan lokasi kamu'}
        aria-pressed={Boolean(active)}
        onClick={() => {
          if (active) {
            mapRef.current?.flyTo({
              center: [location.coords!.lon, location.coords!.lat],
              zoom: 9,
              padding: getMapPadding(panelOpen),
              duration: reducedMotion ? 0 : 600,
            })
            return
          }
          setLocation({ status: 'requesting' })
        }}
      >
        <Crosshair className="size-5" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className={btnClass}
        aria-label="Perbesar"
        onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
      >
        <Plus className="size-5" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className={btnClass}
        aria-label="Perkecil"
        onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
      >
        <Minus className="size-5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
