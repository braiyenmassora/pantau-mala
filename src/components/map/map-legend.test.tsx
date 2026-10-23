/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MapLegend } from '@/components/map/map-legend'

describe('MapLegend', () => {
  afterEach(cleanup)

  it('renders one horizontal legend strip with static symbols', () => {
    render(<MapLegend />)

    expect(screen.getByTestId('map-legend')).toBeTruthy()
    expect(screen.getByText('Radar provinsi')).toBeTruthy()
    expect(
      screen.getByText('Data 24 jam; penanda agregat provinsi, bukan radius dampak'),
    ).toBeTruthy()
    expect(screen.getByText('Deteksi & heatmap')).toBeTruthy()
    expect(screen.getByText('Aktif saat wilayah dipilih')).toBeTruthy()
    expect(screen.getByText('Gempa BMKG')).toBeTruthy()
    expect(screen.getByText('Episentrum; merah = M5+ / dirasakan')).toBeTruthy()
    expect(screen.getByText('Kepadatan satelit')).toBeTruthy()
    expect(screen.getByText('Kuning jarang · Merah padat')).toBeTruthy()

    expect(document.querySelector('.marker--pulse')).toBeNull()
    expect(document.querySelector('.marker--pulse-static')).toBeNull()
  })

  it('exposes the compact mobile legend as a toggle', () => {
    render(<MapLegend />)

    const trigger = screen.getByRole('button', { name: 'Tampilkan legenda peta' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-label')).toBe('Sembunyikan legenda peta')
  })
})
