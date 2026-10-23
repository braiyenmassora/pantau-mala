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

  it('renders risk legend only (density lives in FilterBar)', () => {
    render(<MapLegend />)

    expect(screen.getByTestId('map-legend')).toBeTruthy()
    expect(screen.queryByTestId('map-legend-density-side')).toBeNull()
    const risk = screen.getByLabelText(copy.legend.riskTitle)
    expect(risk).toBeTruthy()
    expect(screen.getByText('Sangat tinggi')).toBeTruthy()
    expect(screen.getByText(copy.legend.noDetectionsTitle)).toBeTruthy()
  })
})
