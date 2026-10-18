import { describe, expect, it } from 'vitest'

import { pinPulseStyle, riskBeatCss, riskBeatMs } from '@/lib/map-beat'

describe('riskBeatMs / riskBeatCss', () => {
  it('maps risk to beat speed', () => {
    expect(riskBeatMs('sangat_tinggi')).toBe(750)
    expect(riskBeatMs('sedang')).toBe(1800)
    expect(riskBeatMs('rendah')).toBe(2600)
    expect(riskBeatCss('sangat_tinggi')).toBe('0.75s')
    expect(riskBeatCss('sedang')).toBe('1.8s')
    expect(riskBeatCss('tanpa_titik')).toBe('2.6s')
  })

  it('pinPulseStyle sets edge-wave css vars', () => {
    const style = pinPulseStyle('sangat_tinggi', '#d93025')
    expect(style['--beat' as keyof typeof style]).toBe('0.75s')
    expect(style['--risk-color' as keyof typeof style]).toBe('#d93025')
  })
})
