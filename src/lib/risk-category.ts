import type { RiskCategory } from '@/data/types'

export type RiskCategoryStyle = {
  label: string
  dot: string
  tint: string
  text: string
}

/** Mirrors `--color-brand` in tokens.css — for MapLibre / SVG that need resolved colors. */
export const BRAND_HEX = '#C2410C'

/** Line / border hex — mirrors `--color-line`. */
export const LINE_HEX = '#E2E8F0'

/** Warna risiko — hex untuk MapLibre / SVG (selaras tokens.css Pantau Mala). */
export const RISK_CATEGORIES: Record<RiskCategory, RiskCategoryStyle> = {
  tidak_tersedia: {
    label: 'Belum dinilai',
    dot: '#64748B',
    tint: '#F8FAFC',
    text: '#475569',
  },
  sangat_tinggi: {
    label: 'Sangat tinggi',
    dot: '#DC2626',
    tint: '#FEE2E2',
    text: '#991B1B',
  },
  sedang: {
    label: 'Sedang',
    dot: '#D97706',
    tint: '#FEF3C7',
    text: '#92400E',
  },
  rendah: {
    label: 'Rendah',
    dot: '#15803D',
    tint: '#F0FDF4',
    text: '#166534',
  },
}

/** Active map pin lift — docs §5; kept here so audit allows the rgba. */
export const PIN_ACTIVE_BOX_SHADOW = '0 2px 8px rgba(15, 23, 42, 0.2)'

/** Mid-high transition color for heatmap gradients. */
export const HEATMAP_ORANGE = '#F97316'

/** Append alpha (0–1) to a #RRGGBB hex. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}

/** Transparent terminal stop for MapLibre heatmap; centralized renderer color. */
export const HEATMAP_TRANSPARENT = 'rgba(0,0,0,0)'

/** Wind particle animation colors for Windy simulation. */
export const WIND_PARTICLE_COLOR = "rgba(14, 165, 233, 0.75)"
export const WIND_FADE_CLEAR = "rgba(0, 0, 0, 0.08)"
