import { copy } from '@/copy/id'
import type { AirQuality, AirQualityCategory, Region, TimeZoneId } from '@/data/types'
import { formatDateTime, formatNumber, formatRelativeAge } from '@/lib/format'

export type AirCardMode = 'missing' | 'pending' | 'stale' | 'ready'

export type AirAdviceCategory = keyof typeof copy.detail.airAdvice

const READY: ReadonlySet<AirQualityCategory> = new Set([
  'baik',
  'sedang',
  'tidak_sehat',
  'sangat_tidak_sehat',
  'berbahaya',
])

/** Mode tampilan kartu udara dari kategori API. */
export function getAirCardMode(category: AirQualityCategory): AirCardMode {
  if (category === 'missing' || category === 'insufficient_data') return 'missing'
  if (category === 'pending_validation') return 'pending'
  if (category === 'stale') return 'stale'
  if (READY.has(category)) return 'ready'
  return 'missing'
}

/** Label sumber: field API bila ada, else fallback Open-Meteo. */
export function airSourceLabel(source?: string | null): string {
  const trimmed = source?.trim()
  return trimmed || copy.detail.airSourceFallback
}

export function airAdviceFor(category: AirQualityCategory): string | null {
  if (category in copy.detail.airAdvice) {
    return copy.detail.airAdvice[category as AirAdviceCategory]
  }
  return null
}

/** Label kategori polos di kartu udara (boleh tanpa penanda). */
const AIR_PLAIN: Partial<Record<AirQualityCategory, string>> = {
  baik: 'Baik',
  sedang: 'Sedang',
  tidak_sehat: 'Tidak sehat',
  sangat_tidak_sehat: 'Sangat tidak sehat',
  berbahaya: 'Berbahaya',
}

/** Tint badge — mirror token risiko (baik=hijau, sedang=kuning, tidak sehat+=merah). */
const AIR_BADGE: Partial<Record<AirQualityCategory, string>> = {
  baik: 'bg-risk-low-tint text-risk-low-text',
  sedang: 'bg-risk-mid-tint text-risk-mid-text',
  tidak_sehat: 'bg-risk-high-tint text-risk-high-text',
  sangat_tidak_sehat: 'bg-risk-high-tint text-risk-high-text',
  berbahaya: 'bg-risk-high-tint text-risk-high-text',
}

/** Label kategori hanya untuk mode ready (bukan pending/stale/missing). */
export function airCategoryLabel(category: AirQualityCategory): string | null {
  if (getAirCardMode(category) !== 'ready') return null
  return AIR_PLAIN[category] ?? copy.air[category]
}

/** Class pill kategori udara; null bila bukan mode ready. */
export function airCategoryBadgeClass(category: AirQualityCategory): string | null {
  if (getAirCardMode(category) !== 'ready') return null
  return AIR_BADGE[category] ?? 'bg-surface-muted text-ink-2'
}

/** Nilai PM2.5 siap tampil di grid metrik (null bila belum siap). */
export function airPm25Value(region: Region): string | null {
  const air = region.air_quality
  const mode = getAirCardMode(air.category)
  if ((mode !== 'ready' && mode !== 'stale') || air.pm25 == null) return null
  return `${formatNumber(air.pm25, { maximumFractionDigits: 1 })} ${copy.detail.airPm25Unit}`
}

/** Waktu pembaruan udara: air_updated_at wilayah, else window_end di payload. */
export function airUpdatedLabel(
  region: { air_updated_at?: string | null; time_zone: TimeZoneId },
  air: Pick<AirQuality, 'window_end'>,
  nowMs: number = Date.now(),
): string | null {
  const iso = region.air_updated_at ?? air.window_end ?? null
  if (!iso) return null
  const relative = formatRelativeAge(iso, nowMs)
  const absolute = formatDateTime(iso, region.time_zone)
  return `${relative} · ${absolute}`
}
