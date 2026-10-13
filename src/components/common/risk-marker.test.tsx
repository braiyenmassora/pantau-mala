/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { RiskMarker } from '@/components/common/risk-marker'

describe('RiskMarker', () => {
  afterEach(() => cleanup())

  it('sangat_tinggi shows Radar risk-high', () => {
    const { container } = render(<RiskMarker kategori="sangat_tinggi" />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('fill-risk-high')).toBe(true)
    expect(svg?.classList.contains('stroke-risk-high')).toBe(true)
  })

  it('sedang shows Radar risk-mid', () => {
    const { container } = render(<RiskMarker kategori="sedang" />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('fill-risk-mid')).toBe(true)
  })

  it('rendah shows 8px risk-low dot without icon', () => {
    const { container } = render(<RiskMarker kategori="rendah" />)
    expect(container.querySelector('svg')).toBeNull()
    const dot = container.querySelector('.bg-risk-low')
    expect(dot?.classList.contains('size-2')).toBe(true)
  })
})
