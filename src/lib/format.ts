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
  return n == null ? '-' : new Intl.NumberFormat('id-ID', options).format(n)
}

/** Inisial avatar pelapor: dua huruf pertama dari dua kata pertama. */
export function reportAuthorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

/** Relatif untuk badge meta; clock = sekarang. Contoh: "46 menit yang lalu". */
export function formatRelativeAge(iso: string, nowMs: number = Date.now()): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return iso
  const mins = Math.max(0, Math.round((nowMs - t) / 60_000))
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit yang lalu`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours} jam yang lalu`
  const days = Math.round(hours / 24)
  return `${days} hari yang lalu`
}

/** Cadence ingest ~3 jam → stale setelah 3,5 jam. */
export const META_STALE_MS = 3.5 * 60 * 60 * 1000

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
  const parts = formatDateTimeParts(iso, zone)
  if (!parts) return iso
  return `${parts.date}, ${parts.clock} ${parts.zone}`
}

/** Tip pin peta: tanggal + jam terpisah → "09 Okt 2026 · 14:05 WIB". */
export function formatDateTimeParts(
  iso: string,
  zone: TimeZoneId,
): { date: string; clock: string; zone: TimeZoneId } | null {
  const p = toZonedParts(iso, zone)
  if (!p) return null
  const dd = String(p.day).padStart(2, '0')
  const mon = SHORT_MONTHS[p.month]
  const hh = String(p.hour).padStart(2, '0')
  const mm = String(p.minute).padStart(2, '0')
  return {
    date: `${dd} ${mon} ${p.year}`,
    clock: `${hh}:${mm}`,
    zone,
  }
}

/** Satu string tip: "09 Okt 2026 · 14:05 WIB". */
export function formatDateDotTime(iso: string, zone: TimeZoneId): string {
  const parts = formatDateTimeParts(iso, zone)
  if (!parts) return iso
  return `${parts.date} · ${parts.clock} ${parts.zone}`
}

/** Skala Y genap agar tick tengah = max/2 (hindari label 11/6/0). */
export function chartScaleMax(maximum: number): number {
  if (maximum <= 0) return 1
  return Math.max(2, Math.ceil(maximum / 2) * 2)
}

/** Label seven calendar days ending today in the region's local time zone. */
export function formatTrendDates(zone: TimeZoneId, nowMs: number = Date.now()): string[] {
  const parts = toZonedParts(new Date(nowMs).toISOString(), zone)
  if (!parts) return Array.from({ length: 7 }, (_, index) => `Hari ${index + 1}`)

  const anchor = Date.UTC(parts.year, parts.month, parts.day)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor - (6 - index) * 24 * 60 * 60 * 1000)
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${day} ${SHORT_MONTHS[date.getUTCMonth()]}`
  })
}
