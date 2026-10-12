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

/** Format number with id-ID decimal comma. */
export function formatNumber(
  n: number | null,
  options?: Intl.NumberFormatOptions,
): string {
  return n == null ? '—' : new Intl.NumberFormat('id-ID', options).format(n)
}

/** Relatif untuk badge meta; clock = sekarang. Contoh: "46 menit lalu". */
export function formatRelativeAge(iso: string, nowMs: number = Date.now()): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return iso
  const mins = Math.max(0, Math.round((nowMs - t) / 60_000))
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours} jam lalu`
  const days = Math.round(hours / 24)
  return `${days} hari lalu`
}

/** Cadence ingest ~3 jam → stale setelah 3,5 jam. */
export const META_STALE_MS = 2 * 60 * 60 * 1000

export function isMetaStale(iso: string, nowMs: number = Date.now()): boolean {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  return nowMs - t > META_STALE_MS
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
