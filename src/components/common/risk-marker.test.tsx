/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { RiskMarker } from '@/components/common/risk-marker'

describe('RiskMarker', () => {
  afterEach(() => cleanup())

  it('sangat_tinggi shows risk-high circle, no Flame svg', () => {
    const { container } = render(<RiskMarker kategori="sangat_tinggi" />)
    expect(container.querySelector('svg')).toBeNull()
    const dot = container.querySelector('.bg-risk-high')
    expect(dot?.classList.contains('rounded-full')).toBe(true)
    expect(dot?.classList.contains('size-2.5')).toBe(true)
  })

  it('sedang shows risk-mid circle', () => {
    const { container } = render(<RiskMarker kategori="sedang" />)
    expect(container.querySelector('.bg-risk-mid')?.classList.contains('rounded-full')).toBe(
      true,
    )
  })

  it('rendah shows risk-low circle', () => {
    const { container } = render(<RiskMarker kategori="rendah" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.querySelector('.bg-risk-low')?.classList.contains('rounded-full')).toBe(
      true,
    )
  })
})
