/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TrendChart } from '@/components/common/trend-chart'

describe('TrendChart', () => {
  it('renders 7 days trendline with summary stats', () => {
    render(
      <TrendChart
        values={[8, 10, 12, 11, 15, 18, 23]}
        timeZone="WIB"
        label="Tren titik panas"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Tren titik panas' })).toBeTruthy()
    expect(screen.getByText('7 hari')).toBeTruthy()
    expect(screen.getAllByText('23').length).toBeGreaterThan(0)
    expect(screen.getByRole('img', { name: /Tren titik panas/ })).toBeTruthy()
  })

  it('renders graceful empty state when values are empty', () => {
    render(<TrendChart values={[]} timeZone="WIB" />)
    expect(screen.getByText(/Riwayat tren belum tersedia/)).toBeTruthy()
  })
})
