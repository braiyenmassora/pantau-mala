/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MapInfoCard } from '@/components/map/map-info-card'

describe('MapInfoCard', () => {
  afterEach(cleanup)

  it('renders single line name without numbers for regency', () => {
    render(<MapInfoCard title="Kab. Kotawaringin Barat" />)
    expect(screen.getByText('Kab. Kotawaringin Barat')).toBeTruthy()
    expect(screen.queryByText(/titik/i)).toBeNull()
  })

  it('renders hotspot details with district, regency, and time', () => {
    render(
      <MapInfoCard
        district="Arut Selatan"
        regency="Kab. Kotawaringin Barat"
        detectedTime="14:30 WIB"
      />,
    )
    expect(screen.getByText('Kecamatan Arut Selatan')).toBeTruthy()
    expect(screen.getByText('Kab. Kotawaringin Barat')).toBeTruthy()
    expect(screen.getByText('Terdeteksi 14:30 WIB')).toBeTruthy()
  })

  it('omits absent fields and never prints "Tidak diketahui"', () => {
    render(<MapInfoCard regency="Kab. Kotawaringin Barat" />)
    expect(screen.getByText('Kab. Kotawaringin Barat')).toBeTruthy()
    expect(screen.queryByText(/kecamatan/i)).toBeNull()
    expect(screen.queryByText(/terdeteksi/i)).toBeNull()
    expect(screen.queryByText(/tidak diketahui/i)).toBeNull()
  })

  it('renders title with subtitle and meta for shared flag pattern', () => {
    render(
      <MapInfoCard
        title="Gempa M 5,2"
        subtitle="84 km BaratLaut Donggala"
        meta="Kedalaman 10 km · BMKG"
      />,
    )
    expect(screen.getByText('Gempa M 5,2')).toBeTruthy()
    expect(screen.getByText('84 km BaratLaut Donggala')).toBeTruthy()
    expect(screen.getByText('Kedalaman 10 km · BMKG')).toBeTruthy()
  })

  it('stacks long lines without trimming', () => {
    render(
      <MapInfoCard
        title="Titik panas"
        lines={[
          'Pohuwato',
          'Terdeteksi 15 Okt 2026, 01:17 WITA',
          'FRP 12,4 MW',
        ]}
      />,
    )
    expect(screen.getByText('Titik panas')).toBeTruthy()
    expect(screen.getByText('Pohuwato')).toBeTruthy()
    expect(screen.getByText('Terdeteksi 15 Okt 2026, 01:17 WITA')).toBeTruthy()
    expect(screen.getByText('FRP 12,4 MW')).toBeTruthy()
    expect(screen.queryByText(/\.\.\./)).toBeNull()
  })
})
