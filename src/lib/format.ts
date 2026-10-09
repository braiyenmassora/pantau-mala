import type { TimeZoneId } from '@/data/types'

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

const ZONE_OFFSET_HOURS: Record<TimeZoneId, number> = {
  WIB: 7,
  WITA: 8,
  WIT: 9,
}

const numberId = new Intl.NumberFormat('id-ID')

/** Format number with id-ID decimal comma. */
export function formatNumber(n: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('id-ID', options).format(n)
}

export function formatPercent(n: number): string {
  return `${numberId.format(Math.round(n))}%`
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
  }
}

/** Example: "09 Okt 2026, 14:05 WIB" — clock follows region time zone. */
export function formatDateTime(iso: string, zone: TimeZoneId): string {
  const p = toZonedParts(iso, zone)
  if (!p) return iso
  const dd = String(p.day).padStart(2, '0')
  const mon = SHORT_MONTHS[p.month]
  const hh = String(p.hour).padStart(2, '0')
  const mm = String(p.minute).padStart(2, '0')
  return `${dd} ${mon} ${p.year}, ${hh}:${mm} ${zone}`
}

/** Example: "03 Okt" */
export function formatDayMonth(iso: string, zone: TimeZoneId = 'WIB'): string {
  const p = toZonedParts(iso, zone)
  if (!p) return iso
  return `${String(p.day).padStart(2, '0')} ${SHORT_MONTHS[p.month]}`
}

/** Trend window labels from meta.diperbarui (end) back 6 days (start). */
export function trendWindowLabels(updatedAtIso: string): { start: string; end: string } {
  const end = new Date(updatedAtIso)
  if (Number.isNaN(end.getTime())) {
    return { start: '—', end: '—' }
  }
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  return {
    start: formatDayMonth(start.toISOString(), 'WIB'),
    end: formatDayMonth(end.toISOString(), 'WIB'),
  }
}

/** Lat, lon with 4 decimal places and dot separator: "-2.7500, 114.2500". */
export function formatCoordinates(lon: number, lat: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}
