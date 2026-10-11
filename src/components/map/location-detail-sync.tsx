import { useEffect, useRef } from 'react'

import { useHotspots } from '@/data/queries'
import type { Region } from '@/data/types'
import { resolveUserRegionCode } from '@/lib/resolve-user-region'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationDetailSyncProps = {
  regions: Region[] | undefined
}

/**
 * When lokasi pengguna baru aktif, buka detail wilayah terdekat
 * (pusat ≤50 km, atau wilayah hotspot terdekat ≤25 km).
 */
export function LocationDetailSync({ regions }: LocationDetailSyncProps) {
  const location = useMapStore((s) => s.location)
  const select = useMapStore((s) => s.select)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data: hotspots } = useHotspots()
  const syncedKey = useRef<string | null>(null)

  useEffect(() => {
    if (location.status !== 'active' || !location.coords) {
      syncedKey.current = null
      return
    }
    if (!regions?.length || !hotspots) return

    const key = `${location.coords.lon.toFixed(5)},${location.coords.lat.toFixed(5)}`
    if (syncedKey.current === key) return

    const code = resolveUserRegionCode(location.coords, regions, hotspots.features)
    syncedKey.current = key
    if (!code) return

    select(code)
    setPanelOpen(true)
  }, [location, regions, hotspots, select, setPanelOpen])

  return null
}
