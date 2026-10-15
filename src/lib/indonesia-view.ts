import type { LngLatBounds, Map as MaplibreMap, PaddingOptions } from 'maplibre-gl'

import { LAYOUT } from '@/lib/layout'

/** Geographic extent of Indonesia (Sabang → Merauke). */
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [94.9, -11.2],
  [141.1, 6.3],
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
export const OVERVIEW_ZOOM_FLOOR = 3.8

/**
 * Padding area aman agar fit nasional tidak ketutup chip/legend/panel.
 */
export function getMapPadding(panelOpen: boolean): PaddingOptions {
  if (typeof window !== 'undefined' && window.innerWidth < 640)
    return {
      left: LAYOUT.gutter,
      top: 72,
      right: LAYOUT.gutter,
      bottom: 88,
    }
  return {
    left: panelOpen ? LAYOUT.overlayInset : 24,
    top: 72,
    right: LAYOUT.controlsClearance,
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
  const zoom = Math.max(camera?.zoom ?? OVERVIEW_ZOOM_FLOOR, OVERVIEW_ZOOM_FLOOR)
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

/** Read current view bounds and lock maxBounds to +10% padding. */
export function applyDynamicMaxBounds(map: MaplibreMap) {
  map.setMaxBounds(expandBounds10(map.getBounds()))
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
  map.setMinZoom(Math.max(OVERVIEW_ZOOM_FLOOR, zoom - 0.35))
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
  const minZoom = Math.max(OVERVIEW_ZOOM_FLOOR, zoom - 0.35)
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
