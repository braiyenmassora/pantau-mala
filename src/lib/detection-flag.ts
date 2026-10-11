import type { Region, TimeZoneId } from '@/data/types'
import { copy } from '@/copy/id'

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

export type DetectionFlagContent = {
  title: string
  subtitle: string
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

/** Flag pin: nama kab/kota + provinsi. Waktu deteksi di panel detail. */
export function buildDetectionFlag(
  region: Pick<Region, 'name' | 'province'>,
): DetectionFlagContent {
  return {
    title: region.name,
    subtitle: copy.map.regionMetaProvince(region.province),
  }
}
