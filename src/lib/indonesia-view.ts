import type { Map as MaplibreMap, PaddingOptions } from 'maplibre-gl'

/** Geographic extent of Indonesia (Sabang → Merauke). */
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [94.9, -11.2],
  [141.1, 6.3],
]

/**
 * Loose maxBounds so fitBounds with panel padding is not clipped.
 * [[85,-18],[150,13]] still clips at 1440+panel; padded view needs ~lon 56–148 at 1024.
 */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [50, -40],
  [155, 35],
]

/** Rough center before the first fitBounds. */
export const INDONESIA_CENTER: [number, number] = [118, -2]

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

export function fitIndonesia(
  map: MaplibreMap,
  panelOpen: boolean,
  duration = 0,
): number {
  const padding = getMapPadding(panelOpen)
  // Drop minZoom first so a prior wider viewport cannot block zooming out.
  map.setMinZoom(0)
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
  return fitZoom
}

/** Recompute fitZoom/minZoom from current size without moving the camera. */
export function refreshFitMinZoom(map: MaplibreMap, panelOpen: boolean): number {
  const camera = map.cameraForBounds(INDONESIA_BOUNDS, {
    padding: getMapPadding(panelOpen),
    absolutePadding: true,
  })
  const fitZoom = camera?.zoom ?? map.getZoom()
  map.setMinZoom(fitZoom - 0.5)
  return fitZoom
}

export function isIndonesiaView(map: MaplibreMap, fitZoom: number): boolean {
  return map.getZoom() <= fitZoom + 0.15
}
