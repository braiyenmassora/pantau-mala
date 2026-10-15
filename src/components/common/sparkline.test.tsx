/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Sparkline } from '@/components/common/sparkline'

describe('Sparkline', () => {
  afterEach(() => cleanup())

  it('renders SVG path and dot for 7-day data', () => {
    const { container } = render(<Sparkline data={[1, 3, 5, 8, 12, 10, 15]} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.querySelector('path')?.getAttribute('d')).toContain('M')
    expect(svg?.querySelector('circle')).toBeTruthy()
  })

  it('renders text-risk-high when trend is naik', () => {
    const { container } = render(<Sparkline data={[0, 0, 1, 2, 8, 10, 15]} />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('text-risk-high')).toBe(true)
  })

  it('renders text-risk-low when trend is turun', () => {
    const { container } = render(<Sparkline data={[15, 12, 10, 6, 2, 1, 0]} />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('text-risk-low')).toBe(true)
  })

  it('renders flat line when all zeroes without error', () => {
    const { container } = render(<Sparkline data={[0, 0, 0, 0, 0, 0, 0]} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.classList.contains('text-ink-3')).toBe(true)
  })

  it('returns null when data has fewer than 2 points', () => {
    const { container } = render(<Sparkline data={[5]} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
