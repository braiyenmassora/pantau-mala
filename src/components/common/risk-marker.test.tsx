/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { RiskMarker } from '@/components/common/risk-marker'

describe('RiskMarker', () => {
  afterEach(() => cleanup())

  it('sangat_tinggi shows red round dot', () => {
    const { container } = render(<RiskMarker kategori="sangat_tinggi" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(
      container.querySelector('.bg-risk-high')?.classList.contains('rounded-full'),
    ).toBe(true)
  })

  it('sedang shows orange round dot', () => {
    const { container } = render(<RiskMarker kategori="sedang" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(
      container.querySelector('.bg-risk-mid')?.classList.contains('rounded-full'),
    ).toBe(true)
  })

  it('rendah shows green round dot', () => {
    const { container } = render(<RiskMarker kategori="rendah" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(
      container.querySelector('.bg-risk-low')?.classList.contains('rounded-full'),
    ).toBe(true)
  })
})
