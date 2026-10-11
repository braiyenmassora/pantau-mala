import type { LngLatBounds, Map as MaplibreMap, PaddingOptions } from 'maplibre-gl'

/** Geographic extent of Indonesia (Sabang → Merauke). */
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [94.9, -11.2],
  [141.1, 6.3],
]

/** Rough center before the first fitBounds. */
export const INDONESIA_CENTER: [number, number] = [118, -2]

/** Shared flyTo zoom for wilayah / lokasi — keeps place framing consistent. */
export const PLACE_ZOOM = 8

export function getMapPadding(panelOpen: boolean): PaddingOptions {
  return {
    left: panelOpen ? 432 : 16,
    top: 68,
    right: 72,
    bottom: 64,
  }
}

/** Matches --ease-out-soft cubic-bezier(0.2, 0.7, 0.2, 1). */
export function easeOutSoft(t: number): number {
  return 1 - (1 - t) ** 3
}

/** Expand bounds 10% on each side (relative to width/height). */
export function expandBounds10(
  bounds: LngLatBounds,
): [[number, number], [number, number]] {
  const west = bounds.getWest()
  const south = bounds.getSouth()
  const east = bounds.getEast()
  const north = bounds.getNorth()
  const lonPad = (east - west) * 0.1
  const latPad = (north - south) * 0.1
  return [
    [west - lonPad, south - latPad],
    [east + lonPad, north + latPad],
  ]
}

function clearMapLimits(map: MaplibreMap) {
  map.setMinZoom(0)
  map.setMaxBounds(null)
}

/** Read current view bounds and lock maxBounds to +10% padding. */
export function applyDynamicMaxBounds(map: MaplibreMap) {
  map.setMaxBounds(expandBounds10(map.getBounds()))
}

/**
 * Fit Indonesia into the padded view, set minZoom = fitZoom − 0.5,
 * then lock maxBounds from the resulting view (+10% each side).
 */
export function fitIndonesia(map: MaplibreMap, panelOpen: boolean, duration = 0): number {
  const padding = getMapPadding(panelOpen)
  clearMapLimits(map)
  map.fitBounds(INDONESIA_BOUNDS, {
    padding,
    absolutePadding: true,
    duration,
    easing: easeOutSoft,
  })
  const camera = map.cameraForBounds(INDONESIA_BOUNDS, {
    padding,
    absolutePadding: true,
  })
  const fitZoom = camera?.zoom ?? map.getZoom()
  map.setMinZoom(fitZoom - 0.5)

  if (duration <= 0) {
    applyDynamicMaxBounds(map)
  } else {
    map.once('moveend', () => applyDynamicMaxBounds(map))
  }
  return fitZoom
}

/**
 * Recompute minZoom + maxBounds for the current size without keeping the
 * camera on the fit view when the user was zoomed in.
 */
export function refreshFitMinZoom(map: MaplibreMap, panelOpen: boolean): number {
  const padding = getMapPadding(panelOpen)
  const prev = {
    center: map.getCenter(),
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  }

  clearMapLimits(map)
  const camera = map.cameraForBounds(INDONESIA_BOUNDS, {
    padding,
    absolutePadding: true,
  })
  const fitZoom = camera?.zoom ?? map.getZoom()
  const wasOverview = prev.zoom <= fitZoom + 0.15

  if (camera?.center != null && camera.zoom != null) {
    map.jumpTo({
      center: camera.center,
      zoom: camera.zoom,
      bearing: 0,
      pitch: 0,
      padding,
    })
  }
  applyDynamicMaxBounds(map)
  map.setMinZoom(fitZoom - 0.5)

  if (!wasOverview) {
    map.jumpTo({
      center: prev.center,
      zoom: Math.max(prev.zoom, fitZoom - 0.5),
      bearing: prev.bearing,
      pitch: prev.pitch,
    })
  }

  return fitZoom
}

export function isIndonesiaView(map: MaplibreMap, fitZoom: number): boolean {
  return map.getZoom() <= fitZoom + 0.15
}
