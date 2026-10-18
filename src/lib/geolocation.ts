import { INDONESIA_BOUNDS } from '@/lib/indonesia-view'

/** Padding derajat di luar bbox peta — GPS di perbatasan tetap dianggap dalam Indonesia. */
export const INDONESIA_LOCATION_PAD_DEG = 1

/** Dev-only override from `?lokasi=lat,lon`. Never used in production builds. */
export function parseDevLocation(): { lat: number; lon: number } | null {
  if (!import.meta.env.DEV) return null
  const raw = new URLSearchParams(window.location.search).get('lokasi')
  if (!raw) return null
  const [latRaw, lonRaw] = raw.split(',')
  const lat = Number(latRaw)
  const lon = Number(lonRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null
  return { lat, lon }
}

export type GeoFailReason = 'denied' | 'error' | 'timeout'

export type GeoResult =
  | { ok: true; lat: number; lon: number }
  | { ok: false; reason: GeoFailReason }

export type ResolvedLocation =
  | { status: 'active'; coords: { lat: number; lon: number } }
  | { status: 'outside'; coords: { lat: number; lon: number } }

/** Bbox Indonesia + padding longgar untuk cek lokasi pengguna. */
export function isWithinIndonesiaLoose(
  lat: number,
  lon: number,
  padDeg: number = INDONESIA_LOCATION_PAD_DEG,
): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false
  const [[minLon, minLat], [maxLon, maxLat]] = INDONESIA_BOUNDS
  return (
    lon >= minLon - padDeg &&
    lon <= maxLon + padDeg &&
    lat >= minLat - padDeg &&
    lat <= maxLat + padDeg
  )
}

/** Status setelah koordinat didapat — luar Indonesia tidak menghitung “dekat kamu”. */
export function locationFromCoords(lat: number, lon: number): ResolvedLocation {
  const coords = { lat, lon }
  if (!isWithinIndonesiaLoose(lat, lon)) {
    return { status: 'outside', coords }
  }
  return { status: 'active', coords }
}

/** Resolve user coords: DEV query wins, else browser geolocation (10s timeout). */
export function resolveUserCoords(): Promise<GeoResult> {
  const dev = parseDevLocation()
  if (dev) return Promise.resolve({ ok: true, ...dev })

  if (!('geolocation' in navigator)) {
    return Promise.resolve({ ok: false, reason: 'error' })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ ok: false, reason: 'denied' })
          return
        }
        if (err.code === err.TIMEOUT) {
          resolve({ ok: false, reason: 'timeout' })
          return
        }
        resolve({ ok: false, reason: 'error' })
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  })
}

/** Fokus ke kolom cari kabupaten/kota di panel. */
export function focusWilayahSearch(): void {
  const input = document.querySelector<HTMLInputElement>(
    'input[aria-label="Cari kabupaten/kota"]',
  )
  input?.focus()
}
