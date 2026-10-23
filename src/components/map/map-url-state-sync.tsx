import { useEffect, useRef } from 'react'

import { readSharedMapState, sharedMapPath } from '@/lib/map-url-state'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

/** Keeps a selected region/hotspot reloadable and safe to share as a URL. */
export function MapUrlStateSync() {
  const selectedCode = useMapStore((state) => state.selectedCode)
  const reportHotspot = useMapStore((state) => state.reportHotspot)
  const earthquakeFocus = useMapStore((state) => state.earthquakeFocus)
  const sharedEarthquakeTime = useMapStore((state) => state.sharedEarthquakeTime)
  const hydrated = useRef(false)
  const lastAppliedUrl = useRef('')

  useEffect(() => {
    const applyLocation = () => {
      const state = readSharedMapState(window.location)
      lastAppliedUrl.current = `${window.location.pathname}${window.location.search}`
      const map = useMapStore.getState()
      map.select(state.regionCode)
      map.setReportHotspot(state.hotspot)
      map.setSharedEarthquakeTime(state.earthquakeTime)
      if (state.earthquakeTime && !map.showEarthquakes) map.toggleEarthquakes()
      if (state.regionCode) useUiStore.getState().setPanelOpen(true)
    }

    applyLocation()
    hydrated.current = true
    window.addEventListener('popstate', applyLocation)
    return () => window.removeEventListener('popstate', applyLocation)
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    const next = sharedMapPath({
      regionCode: selectedCode,
      hotspot: reportHotspot,
      earthquakeTime: earthquakeFocus?.event.waktu ?? sharedEarthquakeTime,
    })
    if (next === lastAppliedUrl.current) return
    window.history.replaceState(null, '', next)
    lastAppliedUrl.current = next
  }, [earthquakeFocus, reportHotspot, selectedCode, sharedEarthquakeTime])

  return null
}
