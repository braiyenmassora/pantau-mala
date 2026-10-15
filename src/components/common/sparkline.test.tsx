/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Sparkline } from '@/components/common/sparkline'

describe('Sparkline', () => {
  afterEach(() => cleanup())

  it('renders area fill, chart stroke, and end signal dot', () => {
    const { container } = render(<Sparkline data={[1, 3, 5, 8, 12, 10, 15]} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.classList.contains('text-chart')).toBe(true)

    const paths = svg?.querySelectorAll('path')
    expect(paths?.length).toBe(2)
    expect(paths?.[0]?.getAttribute('d')).toContain('Z')
    expect(paths?.[1]?.getAttribute('stroke-width')).toBe('1.5')
    expect(svg?.querySelector('circle')).toBeTruthy()
    expect(svg?.querySelector('linearGradient')).toBeTruthy()
  })

  it('returns null when data has fewer than 2 points', () => {
    const { container } = render(<Sparkline data={[5]} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
