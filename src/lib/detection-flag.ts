import type { AirQualityCategory, Region } from '@/data/types'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'

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

export function weatherIconKind(condition: string): WeatherIconKind {
  const c = condition.toLowerCase()
  if (/hujan|gerimis/.test(c)) return 'rain'
  if (/kabut|asap|berdebu/.test(c)) return 'fog'
  if (/cerah/.test(c) && !/awan|berawan/.test(c)) return 'sun'
  return 'cloud'
}

const READY_AIR: ReadonlySet<AirQualityCategory> = new Set([
  'baik',
  'sedang',
  'tidak_sehat',
  'sangat_tidak_sehat',
  'berbahaya',
])

/**
 * Label udara di flag pin — selalu bertanda udara/estimasi
 * agar tidak disamakan dengan risiko titik panas.
 */
export function airFlagLabel(category: AirQualityCategory): string {
  if (category === 'sedang') return copy.air.sedang
  if (READY_AIR.has(category)) return `${copy.air[category]} (estimasi)`
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
