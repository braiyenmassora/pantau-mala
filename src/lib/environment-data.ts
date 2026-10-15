import type { WindyPoint } from '@/data/extended-contract'
import type { Region } from '@/data/types'
import { META_STALE_MS } from '@/lib/format'

export const EARTHQUAKE_FEEDS = ['latest', 'felt', 'm5'] as const
const HOUR_MS = 60 * 60 * 1000

export function validCoordinates(lon: number, lat: number): boolean {
  return Number.isFinite(lon) && Number.isFinite(lat) &&
    lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90
}

export function freshTemperatureRegions(regions: Region[], now: number): Region[] {
  return regions.filter((region) => {
    const temperature = region.weather.temp_c
    const observed = Date.parse(region.weather_updated_at ?? '')
    return temperature !== null && Number.isFinite(temperature) &&
      temperature >= -100 && temperature <= 70 &&
      validCoordinates(...region.center) && Number.isFinite(observed) &&
      observed <= now + 15 * 60_000 && now - observed <= META_STALE_MS
  })
}

export function describeWind(eastward: number, northward: number) {
  const speed = Math.hypot(eastward, northward) * 3.6
  const toDegrees = (Math.atan2(eastward, northward) * 180 / Math.PI + 360) % 360
  const fromDegrees = (toDegrees + 180) % 360
  const cardinal = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'][Math.round(fromDegrees / 45) % 8]
  return { speed, toDegrees, fromDegrees, from: speed < 0.5 ? 'Tenang' : cardinal }
}

export function windForecastWindow(points: WindyPoint[], now: number): WindyPoint[] {
  const seen = new Set<number>()
  return [...points].sort((first, second) => first.ts - second.ts).filter((point) => {
    if (seen.has(point.ts) || point.ts < now - 3 * HOUR_MS || point.ts > now + 48 * HOUR_MS) return false
    seen.add(point.ts)
    return true
  })
}

export function selectWindPoint(points: WindyPoint[], now: number, selectedTime: number | null = null): WindyPoint | undefined {
  const window = windForecastWindow(points, now)
  if (selectedTime !== null) return window.find((point) => point.ts === selectedTime)
  const past = window.filter((point) => point.ts <= now)
  return past.at(-1) ?? window.find((point) => point.ts <= now + 3 * HOUR_MS)
}

export function safeShakemap(url: string): boolean {
  return /^https:\/\/static\.bmkg\.go\.id\/[0-9]+\.mmi\.jpg$/.test(url)
}
