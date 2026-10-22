import { LocateFixed } from 'lucide-react'
import { useEffect, useRef, type RefObject } from 'react'

import { Button, EmptyState } from '@/components/common'
import type { MapRef } from '@/components/ui/map'
import { getCopy } from '@/copy'
import { chromeSurface } from '@/lib/chrome'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { locationFromCoords, resolveUserCoords } from '@/lib/geolocation'
import { getMapPadding, LOCATION_ZOOM } from '@/lib/indonesia-view'
import { useMapChrome } from '@/lib/layout'
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
  const { left } = useMapChrome(panelOpen)
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
        chromeSurface,
        'absolute top-[68px] z-50 w-[min(360px,calc(100vw-2rem))] p-4',
        'ease-out-soft transition-[left] duration-300',
        panelOpen && 'max-sm:hidden',
      )}
      style={{ left }}
      {...mapOverlayGestureProps}
    >
      <EmptyState
        variant="bare"
        icon={LocateFixed}
        titleId="location-prompt-title"
        title={getCopy().location.promptTitle}
        description={getCopy().location.promptBody}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="shadow-none"
              onClick={dismiss}
            >
              {getCopy().location.promptLater}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="shadow-none"
              onClick={() => {
                void resolveUserCoords().then((result) => {
                  if (result.ok) {
                    setLocation(locationFromCoords(result.lat, result.lon))
                    flyToUser(result.lon, result.lat)
                    return
                  }
                  setLocation({ status: result.reason })
                })
              }}
            >
              {getCopy().location.promptContinue}
            </Button>
          </>
        }
      />
    </div>
  )
}
