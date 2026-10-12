import type { RiskCategory } from '@/data/types'

export type RiskCategoryStyle = {
  label: string
  dot: string
  tint: string
  text: string
}

/** Mirrors `--color-brand` in tokens.css — for MapLibre / SVG that need resolved colors. */
export const BRAND_HEX = '#1E6B45'

/** Line / border hex — mirrors `--color-line`. */
export const LINE_HEX = '#E3E9E4'

/** Warna risiko — hex untuk MapLibre / SVG (selaras tokens.css). */
export const RISK_CATEGORIES: Record<RiskCategory, RiskCategoryStyle> = {
  tidak_tersedia: {
    label: 'Tidak tersedia',
    dot: '#7A8A80',
    tint: '#F6F8F6',
    text: '#52645A',
  },
  sangat_tinggi: {
    label: 'Sangat tinggi',
    dot: '#DC3208',
    tint: '#F8D7D0',
    text: '#9A1F0C',
  },
  sedang: {
    label: 'Sedang',
    dot: '#EBA80A',
    tint: '#FBF0CF',
    text: '#7A5600',
  },
  rendah: {
    label: 'Rendah',
    dot: '#2E8B57',
    tint: '#E4F0E8',
    text: '#1E5A3A',
  },
}

/** Active map pin lift — docs §5; kept here so audit allows the rgba. */
export const PIN_ACTIVE_BOX_SHADOW = '0 2px 8px rgba(20, 38, 27, 0.24)'

/** Append alpha (0–1) to a #RRGGBB hex. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}

/** Transparent terminal stop for MapLibre heatmap; centralized renderer color. */
export const HEATMAP_TRANSPARENT = 'rgba(0,0,0,0)'
