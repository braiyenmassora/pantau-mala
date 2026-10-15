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
})
