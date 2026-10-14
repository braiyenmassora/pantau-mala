import { useEffect, useRef, type RefObject } from 'react'

import type { MapRef } from '@/components/ui/map'
import { getMapPadding, LOCATION_ZOOM } from '@/lib/indonesia-view'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationDetailSyncProps = {
  mapRef: RefObject<MapRef | null>
}

/** Keep the national overview visible while framing the user's nearby area. */
export function LocationDetailSync({ mapRef }: LocationDetailSyncProps) {
  const location = useMapStore((s) => s.location)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const syncedKey = useRef<string | null>(null)
  const isLocationActive = location.status === 'active' && !!location.coords

  useEffect(() => {
    if (!isLocationActive || !location.coords) {
      syncedKey.current = null
      return
    }

    const key = `${location.coords.lon.toFixed(5)},${location.coords.lat.toFixed(5)}`
    if (syncedKey.current === key) return
    syncedKey.current = key
    mapRef.current?.flyTo({
      center: [location.coords.lon, location.coords.lat],
      zoom: LOCATION_ZOOM,
      padding: getMapPadding(panelOpen),
      duration: 600,
    })
  }, [isLocationActive, location.coords, mapRef, panelOpen])

  return null
}
