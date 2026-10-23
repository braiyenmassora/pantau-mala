import { getCopy } from '@/copy'
import type { RiskCategory } from '@/data/types'

/** Localized risk label for the current locale. */
export function riskCategoryLabel(category: RiskCategory): string {
  return getCopy().riskCategory[category]
}

export type RiskCategoryStyle = {
  dot: string
  tint: string
  text: string
  /** Tailwind classes for Badge — mirror tint/text tokens. */
  badgeClass: string
  /** Tailwind class for small risk dots in lists/filters. */
  dotClass: string
}

/** Mirrors `--color-brand` — hijau. */
export const BRAND_HEX = '#137333'

/** Lokasi pengguna = brand. */
export const LOCATION_HEX = '#137333'

/** Lapisan suhu. */
export const TEMP_HOT_HEX = BRAND_HEX
export const TEMP_TEXT_HEX = '#1F2328'
export const TEMP_HALO_HEX = '#FFFFFF'

/** Line / border hex — mirrors `--color-line`. */
export const LINE_HEX = '#F0F1F3'

/** Warna risiko / status — hex MapLibre / SVG. */
export const RISK_CATEGORIES: Record<RiskCategory, RiskCategoryStyle> = {
  tidak_tersedia: {
    dot: '#80868B',
    tint: '#F1F3F4',
    text: '#5F6368',
    badgeClass: 'bg-risk-na-tint text-risk-na-text',
    dotClass: 'bg-ink-3',
  },
  tanpa_titik: {
    dot: '#80868B',
    tint: '#F1F3F4',
    text: '#5F6368',
    badgeClass: 'bg-risk-na-tint text-risk-na-text',
    dotClass: 'bg-ink-3',
  },
  sangat_tinggi: {
    dot: '#D93025',
    tint: '#FCE8E6',
    text: '#C5221F',
    badgeClass: 'bg-risk-high-tint text-risk-high-text',
    dotClass: 'bg-risk-high',
  },
  sedang: {
    dot: '#F29900',
    tint: '#FEF7E0',
    text: '#854800',
    badgeClass: 'bg-risk-mid-tint text-risk-mid-text',
    dotClass: 'bg-risk-mid',
  },
  rendah: {
    dot: '#188038',
    tint: '#E6F4EA',
    text: '#137333',
    badgeClass: 'bg-risk-low-tint text-risk-low-text',
    dotClass: 'bg-risk-low',
  },
}

/** Active map pin lift — mirror shadow-map + ink. */
export const PIN_ACTIVE_BOX_SHADOW = '0 2px 8px rgba(31, 35, 40, 0.2)'

/** Append alpha (0–1) to a #RRGGBB hex. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}

/** Transparent terminal stop for MapLibre heatmap. */
export const HEATMAP_TRANSPARENT = 'rgba(0,0,0,0)'

/** Heatmap kepadatan — stop jarang + mid/high (kuning→oranye→merah, terlihat di basemap). */
export const HEATMAP_LOW_HEX = '#FFE08A'
export const HEATMAP_MID_HEX = RISK_CATEGORIES.sedang.dot
export const HEATMAP_HIGH_HEX = RISK_CATEGORIES.sangat_tinggi.dot

/** Wind stream (canvas fade-trail) — brand token + alpha. */
export const WIND_PARTICLE_COLOR = withAlpha(BRAND_HEX, 0.5)
export const WIND_FADE_CLEAR = 'rgba(0, 0, 0, 0.022)'
