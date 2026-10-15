import type { RiskCategory } from '@/data/types'

export type RiskCategoryStyle = {
  label: string
  dot: string
  tint: string
  text: string
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
export const LINE_HEX = '#E8EAED'

/** Warna risiko — hex MapLibre / SVG. */
export const RISK_CATEGORIES: Record<RiskCategory, RiskCategoryStyle> = {
  tidak_tersedia: {
    label: 'Belum dinilai',
    dot: '#80868B',
    tint: '#F1F3F4',
    text: '#5F6368',
  },
  sangat_tinggi: {
    label: 'Sangat tinggi',
    dot: '#D93025',
    tint: '#FCE8E6',
    text: '#C5221F',
  },
  sedang: {
    label: 'Sedang',
    dot: '#F29900',
    tint: '#FEF7E0',
    text: '#854800',
  },
  rendah: {
    label: 'Rendah',
    dot: '#188038',
    tint: '#E6F4EA',
    text: '#137333',
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

/** Stop heatmap jarang — antara transparan & risk-mid (bukan token UI). */
export const HEATMAP_LOW_HEX = '#FFE08A'

/** Wind stream (canvas fade-trail) — brand token + alpha. */
export const WIND_PARTICLE_COLOR = withAlpha(BRAND_HEX, 0.5)
export const WIND_FADE_CLEAR = 'rgba(0, 0, 0, 0.022)'
