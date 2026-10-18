import type { CSSProperties } from 'react'

import type { RiskCategory } from '@/data/types'

/** Periode denyut radius/pin — sama keluarga marker--pulse / soft-pulse. */
export function riskBeatMs(category: RiskCategory): number {
  if (category === 'sangat_tinggi') return 750
  if (category === 'sedang') return 1800
  return 2600
}

export function riskBeatCss(category: RiskCategory): string {
  if (category === 'sangat_tinggi') return '0.75s'
  if (category === 'sedang') return '1.8s'
  return '2.6s'
}

/** Style CSS vars untuk riak pin (warna penuh dari tepi). */
export function pinPulseStyle(category: RiskCategory, color: string): CSSProperties {
  return {
    '--risk-color': color,
    '--beat': riskBeatCss(category),
  } as CSSProperties
}
