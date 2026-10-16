/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MapLegend } from '@/components/map/map-legend'
import { copy } from '@/copy/id'

describe('MapLegend', () => {
  afterEach(cleanup)

  it('renders two elongated cards: risk row + density', () => {
    render(<MapLegend />)

    expect(screen.getByTestId('map-legend')).toBeTruthy()
    const risk = screen.getByLabelText(copy.legend.riskTitle)
    const density = screen.getByLabelText(
      `${copy.legend.densityTitle}: ${copy.legend.densityLow}, ${copy.legend.densityMid}, ${copy.legend.densityHigh}`,
    )
    expect(risk).toBeTruthy()
    expect(density).toBeTruthy()
    expect(screen.getByText('Sangat tinggi')).toBeTruthy()
    expect(risk.getAttribute('title')).toBe(copy.legend.riskNote)
    expect(density.textContent).toContain(copy.legend.densityLow)
    expect(density.textContent).toContain(copy.legend.densityMid)
    expect(density.textContent).toContain(copy.legend.densityHigh)
  })
})
