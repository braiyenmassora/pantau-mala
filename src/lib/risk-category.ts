import type { RiskCategory } from '@/data/types'

export type RiskCategoryStyle = {
  label: string
  dot: string
  tint: string
  text: string
}

/** Mirrors `--color-brand` — hijau. */
export const BRAND_HEX = '#14634c'

/** Lokasi pengguna = brand. */
export const LOCATION_HEX = '#14634c'

/** Lapisan suhu. */
export const TEMP_HOT_HEX = BRAND_HEX
export const TEMP_TEXT_HEX = '#0F172A'
export const TEMP_HALO_HEX = '#FFFFFF'

/** Line / border hex — mirrors `--color-line`. */
export const LINE_HEX = '#E2E8F0'

/** Warna risiko — hex MapLibre / SVG. */
export const RISK_CATEGORIES: Record<RiskCategory, RiskCategoryStyle> = {
  tidak_tersedia: {
    label: 'Belum dinilai',
    dot: '#94A3B8',
    tint: '#F1F5F9',
    text: '#334155',
  },
  sangat_tinggi: {
    label: 'Sangat tinggi',
    dot: '#DC2626',
    tint: '#FEF2F2',
    text: '#991B1B',
  },
  sedang: {
    label: 'Sedang',
    dot: '#D97706',
    tint: '#FFFBEB',
    text: '#92400E',
  },
  rendah: {
    label: 'Rendah',
    dot: '#14634C',
    tint: '#EAF3EE',
    text: '#0E4B39',
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

/** Open-Meteo temperature step colors used by the map overlay. */
export const TEMP_GRADIENT_STOPS = [
  '#0F766E',
  '#0D9488',
  '#D97706',
  '#EA580C',
  '#DC2626',
] as const

/** Wind stream (canvas fade-trail) — brand token + alpha. */
export const WIND_PARTICLE_COLOR = withAlpha(BRAND_HEX, 0.5)
export const WIND_FADE_CLEAR = 'rgba(0, 0, 0, 0.022)'
