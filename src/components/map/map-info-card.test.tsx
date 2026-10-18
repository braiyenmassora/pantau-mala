/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MapInfoCard } from '@/components/map/map-info-card'
import { copy } from '@/copy/id'

describe('MapInfoCard', () => {
  afterEach(cleanup)

  it('renders location title without satellite fields', () => {
    render(<MapInfoCard title="Kab. Kotawaringin Barat" />)
    expect(screen.getByText('Kab. Kotawaringin Barat')).toBeTruthy()
    expect(screen.queryByText(/satelit/i)).toBeNull()
  })

  it('renders hotspot location, count and date · time', () => {
    render(
      <MapInfoCard
        district="Arut Selatan"
        regency="Kab. Kotawaringin Barat"
        meta={copy.map.regionMetaHotspots('1')}
        updatedAt="09 Okt 2026 · 14:05 WIB"
      />,
    )
    expect(screen.getByText('Kecamatan Arut Selatan')).toBeTruthy()
    expect(screen.getByText('Kab. Kotawaringin Barat')).toBeTruthy()
    expect(screen.getByText(/1 titik panas/)).toBeTruthy()
    expect(screen.getByText('09 Okt 2026')).toBeTruthy()
    expect(screen.getByText('14:05 WIB')).toBeTruthy()
    expect(screen.queryByText(/Terdeteksi/)).toBeNull()
    expect(screen.queryByText(/Satelit/)).toBeNull()
    expect(screen.queryByText(/Keyakinan/)).toBeNull()
  })

  it('omits empty district without blank rows', () => {
    render(
      <MapInfoCard
        regency="Kab. Kotawaringin Barat"
        updatedAt="09 Okt 2026 · 14:30 WIB"
        district=""
      />,
    )
    expect(screen.getByText('Kab. Kotawaringin Barat')).toBeTruthy()
    expect(screen.queryByText(/kecamatan/i)).toBeNull()
    expect(screen.getByText('09 Okt 2026')).toBeTruthy()
  })

  it('uses fallback heading when region and district are missing', () => {
    render(<MapInfoCard updatedAt="09 Okt 2026 · 14:05 WIB" />)
    expect(screen.getByText(copy.map.hotspotUntitled)).toBeTruthy()
    expect(screen.getByText('14:05 WIB')).toBeTruthy()
  })

  it('renders title with hotspot count for region pin pattern', () => {
    render(
      <MapInfoCard
        title="Kab. Merauke"
        meta="12 titik panas"
        updatedAt="18 Okt 2026 · 08:00 WIT"
      />,
    )
    expect(screen.getByText('Kab. Merauke')).toBeTruthy()
    expect(screen.getByText('12 titik panas')).toBeTruthy()
    expect(screen.getByText('18 Okt 2026')).toBeTruthy()
    expect(screen.getByText('08:00 WIT')).toBeTruthy()
  })

  it('stacks long lines without trimming', () => {
    render(
      <MapInfoCard
        title="Titik panas"
        lines={['Pohuwato']}
        updatedAt="15 Okt 2026 · 01:17 WITA"
      />,
    )
    expect(screen.getByText('Titik panas')).toBeTruthy()
    expect(screen.getByText('Pohuwato')).toBeTruthy()
    expect(screen.getByText('15 Okt 2026')).toBeTruthy()
  })
})
