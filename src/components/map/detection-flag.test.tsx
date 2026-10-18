/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DetectionFlag } from '@/components/map/detection-flag'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'

const merauke: Region = {
  code: '93.01',
  name: 'Kab. Merauke',
  province: 'Papua Selatan',
  time_zone: 'WIT',
  center: [140.4, -8.5],
  weather_danger: { class: 'aman', fwi: 3, source: 'FWI dihitung' },
  risk_category: 'rendah',
  hotspots_24h: 2,
  trend_7d: [4, 3, 3, 2, 3, 2, 2],
  weather: {
    temp_c: 30,
    condition: 'Hujan ringan',
    humidity: 72,
    wind_kmh: 10,
    dry_days: 1,
  },
  air_quality: { pm25: 8.1, category: 'baik' },
  last_detection: {
    time: '2026-10-09T20:52:00.000Z',
    satellite: 'MODIS Aqua',
    confidence: 'tinggi',
    frp_mw: 2.1,
    village: 'Sota',
    district: 'Sota',
  },
  summary: '',
  actions: [],
}

describe('DetectionFlag', () => {
  afterEach(cleanup)

  it('shows location, count and updated time without satellite', () => {
    const { container } = render(<DetectionFlag region={merauke} />)
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('rounded-card')

    expect(screen.getByText('Kab. Merauke')).toBeTruthy()
    expect(screen.getByText(/2 titik panas/)).toBeTruthy()
    expect(screen.queryByText(/Provinsi/)).toBeNull()
    expect(screen.queryByText(/MODIS/)).toBeNull()
    expect(screen.queryByText(copy.map.popupDisclaimer)).toBeNull()
    // WIT: 2026-10-09T20:52Z → 09 Okt 2026 · 05:52 WIT
    expect(screen.getByText(/Okt 2026/)).toBeTruthy()
    expect(screen.getByText(/WIT/)).toBeTruthy()
  })
})
