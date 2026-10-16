/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MapInfoCard } from '@/components/map/map-info-card'
import { copy } from '@/copy/id'
import type { ConfidenceLevel } from '@/data/types'

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

  it('renders satellite and detection confidence from API fields', () => {
    render(
      <MapInfoCard
        district="Arut Selatan"
        regency="Kab. Kotawaringin Barat"
        detectedTime="09 Okt 2026, 14:05 WIB"
        satellite="VIIRS NOAA-21"
        confidence="tinggi"
      />,
    )
    expect(screen.getByText('Satelit: VIIRS NOAA-21')).toBeTruthy()
    expect(
      screen.getByText(
        `${copy.map.detectionConfidence}: ${copy.detail.confidence.tinggi}`,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/kebakaran terdeteksi|api aktif|bahaya/i)).toBeNull()
  })

  it('uses fallback heading when region and district are missing', () => {
    const { container } = render(
      <MapInfoCard satellite="VIIRS NOAA-21" confidence="tinggi" />,
    )
    const heading = screen.getByText(copy.map.hotspotUntitled)
    expect(heading).toBeTruthy()
    expect(heading.className).toMatch(/font-semibold/)
    expect(screen.getByText('Satelit: VIIRS NOAA-21')).toBeTruthy()
    expect(
      container.querySelectorAll('p.font-semibold, p[class*="font-semibold"]'),
    ).toHaveLength(1)
    expect(heading.textContent?.trim()).toBe(copy.map.hotspotUntitled)
  })

  it('omits empty satellite and district without blank rows', () => {
    const { container } = render(
      <MapInfoCard
        regency="Kab. Kotawaringin Barat"
        detectedTime="14:30 WIB"
        satellite="  "
        district=""
        confidence="sedang"
      />,
    )
    expect(screen.getByText('Kab. Kotawaringin Barat')).toBeTruthy()
    expect(screen.queryByText(/kecamatan/i)).toBeNull()
    expect(screen.queryByText(/^Satelit:/)).toBeNull()
    expect(
      screen.getByText(
        `${copy.map.detectionConfidence}: ${copy.detail.confidence.sedang}`,
      ),
    ).toBeTruthy()
    expect(container.textContent).not.toMatch(/undefined/)
    expect(screen.queryByText(/tidak diketahui/i)).toBeNull()
  })

  it.each([
    ['rendah', copy.detail.confidence.rendah],
    ['sedang', copy.detail.confidence.sedang],
    ['tinggi', copy.detail.confidence.tinggi],
  ] as const satisfies ReadonlyArray<readonly [ConfidenceLevel, string]>)(
    'maps confidence %s to label %s',
    (level, label) => {
      render(<MapInfoCard confidence={level} regency="Kab. Test" />)
      expect(screen.getByText(`${copy.map.detectionConfidence}: ${label}`)).toBeTruthy()
      expect(screen.queryByText(new RegExp(`: ${level}$`))).toBeNull()
    },
  )

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
        lines={['Pohuwato', 'Terdeteksi 15 Okt 2026, 01:17 WITA']}
      />,
    )
    expect(screen.getByText('Titik panas')).toBeTruthy()
    expect(screen.getByText('Pohuwato')).toBeTruthy()
    expect(screen.getByText('Terdeteksi 15 Okt 2026, 01:17 WITA')).toBeTruthy()
    expect(screen.queryByText(/FRP/i)).toBeNull()
    expect(screen.queryByText(/\.\.\./)).toBeNull()
  })

  it('wraps long satellite names within max width', () => {
    const long = 'VIIRS NOAA-20 / NOAA-21 / Suomi NPP very-long-instrument-name-for-wrap'
    const { container } = render(
      <MapInfoCard regency="Kab. Test" satellite={long} confidence="rendah" />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toMatch(/max-w-\[min\(280px,70vw\)\]/)
    expect(screen.getByText(`Satelit: ${long}`).className).toMatch(/break-words/)
  })
})
