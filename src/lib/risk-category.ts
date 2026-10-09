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

/** Colors from docs/spesifikasi-ui.md — hex values, not Tailwind classes. */
export const RISK_CATEGORIES: Record<RiskCategory, RiskCategoryStyle> = {
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

const RISK_RANK: Record<RiskCategory, number> = {
  rendah: 0,
  sedang: 1,
  sangat_tinggi: 2,
}

export function highestRiskCategory(categories: RiskCategory[]): RiskCategory {
  let best: RiskCategory = 'rendah'
  for (const c of categories) {
    if (RISK_RANK[c] > RISK_RANK[best]) best = c
  }
  return best
}

/** Append alpha (0–1) to a #RRGGBB hex. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}
