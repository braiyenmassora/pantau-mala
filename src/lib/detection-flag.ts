import type { AirQualityCategory, Region, TimeZoneId } from '@/data/types'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'

const FULL_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

const ZONE_OFFSET_HOURS: Record<TimeZoneId, number> = {
  WIB: 7,
  WITA: 8,
  WIT: 9,
}

/** Ikon cuaca ringkas untuk flag pin. */
export type WeatherIconKind = 'sun' | 'cloud' | 'rain' | 'fog'

export type DetectionFlagContent = {
  title: string
  subtitle: string
  tempLabel: string | null
  weatherKind: WeatherIconKind
  airLabel: string
  airCategory: AirQualityCategory
}

function toZonedParts(iso: string, zone: TimeZoneId) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const local = new Date(date.getTime() + ZONE_OFFSET_HOURS[zone] * 60 * 60 * 1000)
  return {
    day: local.getUTCDate(),
    month: local.getUTCMonth(),
    year: local.getUTCFullYear(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    second: local.getUTCSeconds(),
  }
}

/** Example: "10 Oktober 2026 05:52:00" — zona wilayah, bulan penuh, dengan detik. */
export function formatDetectionDate(iso: string, zone: TimeZoneId): string {
  const p = toZonedParts(iso, zone)
  if (!p) return iso
  const mon = FULL_MONTHS[p.month]
  const hh = String(p.hour).padStart(2, '0')
  const mm = String(p.minute).padStart(2, '0')
  const ss = String(p.second).padStart(2, '0')
  return `${p.day} ${mon} ${p.year} ${hh}:${mm}:${ss}`
}

export function weatherIconKind(condition: string): WeatherIconKind {
  const c = condition.toLowerCase()
  if (/hujan|gerimis/.test(c)) return 'rain'
  if (/kabut|asap|berdebu/.test(c)) return 'fog'
  if (/cerah/.test(c) && !/awan|berawan/.test(c)) return 'sun'
  return 'cloud'
}

/** Label udara singkat di flag (tanpa "(udara)"). */
function airFlagLabel(category: AirQualityCategory): string {
  if (category === 'sedang') return 'Sedang'
  return copy.air[category]
}

/** Flag pin: nama, provinsi, suhu + ikon cuaca/udara. */
export function buildDetectionFlag(
  region: Pick<Region, 'name' | 'province' | 'weather' | 'air_quality'>,
): DetectionFlagContent {
  const temp = region.weather.temp_c
  return {
    title: region.name,
    subtitle: copy.map.regionMetaProvince(region.province),
    tempLabel: temp == null ? null : `${formatNumber(temp)}°C`,
    weatherKind: weatherIconKind(region.weather.condition),
    airLabel: airFlagLabel(region.air_quality.category),
    airCategory: region.air_quality.category,
  }
}
