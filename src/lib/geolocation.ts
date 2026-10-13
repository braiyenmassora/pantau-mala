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

export type GeoResult =
  { ok: true; lat: number; lon: number } | { ok: false; reason: 'denied' | 'error' }

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
      (err) =>
        resolve({
          ok: false,
          reason: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  })
}
