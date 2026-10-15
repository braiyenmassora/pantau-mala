/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MapLegend } from '@/components/map/map-legend'

describe('MapLegend', () => {
  afterEach(cleanup)

  it('renders one horizontal legend strip with static symbols', () => {
    render(<MapLegend />)

    expect(screen.getByTestId('map-legend')).toBeTruthy()
    expect(screen.getByText('Risiko wilayah')).toBeTruthy()
    expect(screen.getByText('Warna area dan titik hotspot')).toBeTruthy()
    expect(screen.getByText('Gempa bumi')).toBeTruthy()
    expect(screen.getByText('Episentrum dari feed BMKG')).toBeTruthy()
    expect(screen.getByText('Kepadatan satelit')).toBeTruthy()
    expect(screen.getByText('Kuning jarang · Merah padat')).toBeTruthy()

    expect(document.querySelector('.marker--pulse')).toBeNull()
    expect(document.querySelectorAll('.marker--pulse-static').length).toBe(2)
  })
})
