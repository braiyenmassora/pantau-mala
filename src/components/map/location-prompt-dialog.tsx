import { MapPin } from 'lucide-react'
import { useEffect, useRef, type RefObject } from 'react'

import { Button, EmptyState } from '@/components/common'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { resolveUserCoords } from '@/lib/geolocation'
import { getMapPadding, LOCATION_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationPromptDialogProps = {
  mapRef: RefObject<MapRef | null>
}

export function LocationPromptDialog({ mapRef }: LocationPromptDialogProps) {
  const status = useMapStore((s) => s.location.status)
  const setLocation = useMapStore((s) => s.setLocation)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status !== 'requesting') return
    const root = dialogRef.current
    const focusable = root?.querySelector<HTMLElement>('button')
    focusable?.focus()
  }, [status])

  if (status !== 'requesting') return null

  const dismiss = () => {
    setLocation({ status: 'off' })
    restoreFocusTrigger()
  }

  const flyToUser = (lon: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lon, lat],
      zoom: LOCATION_ZOOM,
      padding: getMapPadding(panelOpen),
      duration: reducedMotion ? 0 : 600,
    })
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-prompt-title"
      className={cn(
        'rounded-panel bg-surface absolute top-[68px] z-50 w-[360px] p-4 shadow-sm',
        'ease-out-soft transition-[left] duration-300',
        panelOpen ? 'left-[432px]' : 'left-4',
      )}
      {...mapOverlayGestureProps}
    >
      <EmptyState
        variant="bare"
        icon={MapPin}
        titleId="location-prompt-title"
        title={copy.location.promptTitle}
        description={copy.location.promptBody}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={dismiss}>
              {copy.location.promptLater}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                void resolveUserCoords().then((result) => {
                  if (result.ok) {
                    setLocation({
                      status: 'active',
                      coords: { lon: result.lon, lat: result.lat },
                    })
                    flyToUser(result.lon, result.lat)
                    return
                  }
                  setLocation({ status: result.reason })
                })
              }}
            >
              {copy.location.promptContinue}
            </Button>
          </>
        }
      />
    </div>
  )
}
