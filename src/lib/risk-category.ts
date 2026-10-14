import type { RiskCategory } from '@/data/types'

export type RiskCategoryStyle = {
  label: string
  dot: string
  tint: string
  text: string
}

/** Mirrors `--color-brand` — PDF §1 hijau brand. */
export const BRAND_HEX = '#1E6B45'

/** Lokasi pengguna = brand (PDF: tidak ada biru). */
export const LOCATION_HEX = '#1E6B45'

/** Atmospheric extreme heat — brand/risk-high family. */
export const TEMP_HOT_HEX = '#C2410C'
export const TEMP_TEXT_HEX = '#14261B'
export const TEMP_HALO_HEX = '#FFFFFF'

/** Line / border hex — mirrors `--color-line`. */
export const LINE_HEX = '#E3E9E4'

/** Warna risiko — hex MapLibre / SVG (PDF §1). */
export const RISK_CATEGORIES: Record<RiskCategory, RiskCategoryStyle> = {
  tidak_tersedia: {
    label: 'Belum dinilai',
    dot: '#7A8A80',
    tint: '#F6F8F6',
    text: '#52645A',
  },
  sangat_tinggi: {
    label: 'Sangat tinggi',
    dot: '#C2410C',
    tint: '#F8D7D0',
    text: '#8E2414',
  },
  sedang: {
    label: 'Sedang',
    dot: '#D99A0B',
    tint: '#FBF0CF',
    text: '#6B4E00',
  },
  rendah: {
    label: 'Rendah',
    dot: '#2E8B57',
    tint: '#E4F0E8',
    text: '#1E5A3A',
  },
}

/** Active map pin lift — PDF shadow-map family. */
export const PIN_ACTIVE_BOX_SHADOW = '0 2px 8px rgba(20, 38, 27, 0.2)'

/** Mid-high transition for heatmap gradients. */
export const HEATMAP_ORANGE = '#D99A0B'

/** Append alpha (0–1) to a #RRGGBB hex. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}

/** Transparent terminal stop for MapLibre heatmap. */
export const HEATMAP_TRANSPARENT = 'rgba(0,0,0,0)'

/** Wind stream (canvas fade-trail). Brand hijau; fade rendah = ekor panjang. */
export const WIND_PARTICLE_COLOR = 'rgba(30, 107, 69, 0.5)'
export const WIND_FADE_CLEAR = 'rgba(0, 0, 0, 0.022)'
