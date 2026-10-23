import type { Map as MaplibreMap, PaddingOptions } from 'maplibre-gl'

import { LAYOUT } from '@/lib/layout'

/**
 * Geographic overview Indonesia (Sabang → Merauke), with a small visual
 * buffer. The buffer matters when the left information panel is open: the
 * outer islands must remain visible rather than touching the viewport edge.
 */
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [92.8, -12.8],
  [143.4, 8.1],
]

/** Comfortable navigation envelope around the archipelago. */
export const INDONESIA_NAVIGATION_BOUNDS: [[number, number], [number, number]] = [
  [88, -16],
  [148, 12],
]

/** Rough center before the first fitBounds. */
export const INDONESIA_CENTER: [number, number] = [118, -2]

/** Shared flyTo zoom for wilayah / lokasi — keeps place framing consistent. */
export const PLACE_ZOOM = 8
/** Location framing: nearby context without hiding the national overview. */
export const LOCATION_ZOOM = 5.5
/**
 * Lantai zoom overview nasional — jangan naikkan di atas cameraForBounds:
 * Sabang→Merauke harus muat (Papua tidak boleh terpotong).
 */
export const OVERVIEW_ZOOM_FLOOR = 3.2
export const MOBILE_OVERVIEW_ZOOM_CEILING = 3

function overviewZoomFloor() {
  return typeof window !== 'undefined' && window.innerWidth < 640
    ? 2
    : OVERVIEW_ZOOM_FLOOR
}

/**
 * Padding area aman agar fit nasional tidak ketutup chip/legend/panel.
 */
export function getMapPadding(panelOpen: boolean): PaddingOptions {
  if (typeof window !== 'undefined' && window.innerWidth < 640)
    return {
      left: LAYOUT.gutter,
      top: 72,
      right: LAYOUT.controlSize + LAYOUT.gutter,
      bottom: panelOpen ? Math.min(window.innerHeight * 0.64, 620) + LAYOUT.gutter : 88,
    }
  return {
    left: panelOpen ? LAYOUT.overlayInset : 24,
    top: 72,
    right: LAYOUT.controlsClearance + LAYOUT.gutter,
    bottom: 96,
  }
}

function overviewCamera(map: MaplibreMap, panelOpen: boolean) {
  const padding = getMapPadding(panelOpen)
  const camera = map.cameraForBounds(INDONESIA_BOUNDS, {
    padding,
    absolutePadding: true,
  })
  // Pakai zoom natural fitBounds; lantai hanya cegah zoom terlalu jauh ke luar negeri.
  const floor = overviewZoomFloor()
  const naturalZoom = Math.max(camera?.zoom ?? floor, floor)
  const zoom =
    typeof window !== 'undefined' && window.innerWidth < 640
      ? Math.min(naturalZoom, MOBILE_OVERVIEW_ZOOM_CEILING)
      : naturalZoom
  const rawCenter = camera?.center
  const center: [number, number] =
    rawCenter != null
      ? Array.isArray(rawCenter)
        ? [rawCenter[0], rawCenter[1]]
        : typeof rawCenter === 'object' &&
            rawCenter !== null &&
            'lng' in rawCenter &&
            'lat' in rawCenter
          ? [(rawCenter as { lng: number }).lng, (rawCenter as { lat: number }).lat]
          : INDONESIA_CENTER
      : INDONESIA_CENTER
  return { center, zoom, padding }
}

/** Matches --ease-out-soft cubic-bezier(0.2, 0.7, 0.2, 1). */
export function easeOutSoft(t: number): number {
  return 1 - (1 - t) ** 3
}

function clearMapLimits(map: MaplibreMap) {
  map.setMinZoom(0)
  map.setMaxBounds(null)
}

/** Pending maxBounds apply — batalkan saat fit baru supaya moveend lama tidak mengunci kamera. */
let pendingMaxBoundsMap: MaplibreMap | null = null
let pendingMaxBoundsHandler: (() => void) | null = null

function cancelPendingMaxBounds() {
  if (pendingMaxBoundsMap && pendingMaxBoundsHandler) {
    pendingMaxBoundsMap.off('moveend', pendingMaxBoundsHandler)
  }
  pendingMaxBoundsMap = null
  pendingMaxBoundsHandler = null
}

function scheduleMaxBounds(map: MaplibreMap, duration: number) {
  cancelPendingMaxBounds()
  if (duration <= 0) {
    applyDynamicMaxBounds(map)
    return
  }
  // Pakai on/off (bukan once): MapLibre once() membungkus listener sehingga off(handler) gagal.
  const handler = () => {
    if (pendingMaxBoundsHandler !== handler) return
    pendingMaxBoundsMap = null
    pendingMaxBoundsHandler = null
    map.off('moveend', handler)
    applyDynamicMaxBounds(map)
  }
  pendingMaxBoundsMap = map
  pendingMaxBoundsHandler = handler
  map.on('moveend', handler)
}

/**
 * Zoom ke bbox wilayah. Longgarkan maxBounds untuk fit; jangan kunci ulang ke
 * viewport provinsi — itu memblokir pinch/scroll zoom-out.
 * Batas nasional dipulihkan lewat fitIndonesia saat kembali ke "Semua".
 */
export function fitProvinceBounds(
  map: MaplibreMap,
  bbox: [number, number, number, number],
  panelOpen: boolean,
  duration = 600,
): void {
  const [minLon, minLat, maxLon, maxLat] = bbox
  const padding = getMapPadding(panelOpen)
  cancelPendingMaxBounds()
  map.setMaxBounds(null)
  map.stop()
  map.fitBounds(
    [
      [minLon, minLat],
      [maxLon, maxLat],
    ],
    {
      padding,
      absolutePadding: true,
      duration,
      easing: easeOutSoft,
    },
  )
}

/** Keep panning inside a generous Indonesia envelope, not the current viewport. */
export function applyDynamicMaxBounds(map: MaplibreMap) {
  map.setMaxBounds(INDONESIA_NAVIGATION_BOUNDS)
}

/**
 * Overview nasional dengan zoom lantai agar nama provinsi kebaca.
 * Lalu kunci maxBounds dari viewport (+10%).
 */
export function fitIndonesia(map: MaplibreMap, panelOpen: boolean, duration = 0): number {
  const { center, zoom, padding } = overviewCamera(map, panelOpen)
  cancelPendingMaxBounds()
  clearMapLimits(map)
  map.stop()
  if (duration <= 0) {
    map.jumpTo({ center, zoom, bearing: 0, pitch: 0, padding })
  } else {
    map.easeTo({
      center,
      zoom,
      bearing: 0,
      pitch: 0,
      padding,
      duration,
      easing: easeOutSoft,
    })
  }
  map.setMinZoom(overviewZoomFloor())
  scheduleMaxBounds(map, duration)
  return zoom
}

/**
 * Recompute minZoom + maxBounds for the current size without keeping the
 * camera on the fit view when the user was zoomed in.
 */
export function refreshFitMinZoom(map: MaplibreMap, panelOpen: boolean): number {
  const { center, zoom, padding } = overviewCamera(map, panelOpen)
  const prev = {
    center: map.getCenter(),
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  }
  const minZoom = overviewZoomFloor()
  const wasOverview = prev.zoom <= zoom + 0.15

  clearMapLimits(map)
  map.jumpTo({ center, zoom, bearing: 0, pitch: 0, padding })
  applyDynamicMaxBounds(map)
  map.setMinZoom(minZoom)

  if (!wasOverview) {
    map.jumpTo({
      center: prev.center,
      zoom: Math.max(prev.zoom, minZoom),
      bearing: prev.bearing,
      pitch: prev.pitch,
    })
  }

  return zoom
}

export function isIndonesiaView(map: MaplibreMap, fitZoom: number): boolean {
  return map.getZoom() <= fitZoom + 0.15
}
