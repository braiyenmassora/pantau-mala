/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { MapLegend } from '@/components/map/map-legend'
import { copy } from '@/copy/id'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('MapLegend', () => {
  beforeEach(() => {
    global.ResizeObserver = ResizeObserverStub
  })
  afterEach(cleanup)

  it('renders risk (web) + density legend cards', () => {
    render(<MapLegend />)

    expect(screen.getByTestId('map-legend')).toBeTruthy()
    const risk = screen.getByLabelText(copy.legend.riskTitle)
    const density = screen.getByLabelText(
      `${copy.legend.densityTitle}: ${copy.legend.densityLow}, ${copy.legend.densityMid}, ${copy.legend.densityHigh}`,
    )
    expect(risk).toBeTruthy()
    expect(risk.className).toMatch(/sm:flex/)
    expect(density).toBeTruthy()
    expect(density.textContent).toContain(copy.legend.densityLow)
    expect(screen.getByText('Sangat tinggi')).toBeTruthy()
    expect(screen.getByText(copy.legend.noDetectionsTitle)).toBeTruthy()
  })
})
