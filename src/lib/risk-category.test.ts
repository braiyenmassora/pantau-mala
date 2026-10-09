import { describe, expect, it } from 'vitest'

import { RISK_CATEGORIES } from '@/lib/risk-category'

function channel(hex: string, i: number): number {
  const n = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2)
}

function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg)
  const b = luminance(bg)
  const [lighter, darker] = a > b ? [a, b] : [b, a]
  return (lighter + 0.05) / (darker + 0.05)
}

describe('RISK_CATEGORIES contrast', () => {
  it.each(Object.entries(RISK_CATEGORIES))(
    '%s risk-*-text on risk-*-tint ≥ 4.5:1',
    (_key, style) => {
      expect(contrastRatio(style.text, style.tint)).toBeGreaterThanOrEqual(4.5)
    },
  )
})
