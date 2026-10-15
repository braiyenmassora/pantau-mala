/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DetectionFlag } from '@/components/map/detection-flag'
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

  it('shows name, province, temp and air above the pin', () => {
    const { container } = render(<DetectionFlag region={merauke} />)
    const card = container.querySelector('.rounded-ctl')
    expect(card?.className).toContain('border-line')
    expect(card?.className).toContain('bg-surface')
    expect(card?.className).toContain('shadow-chrome')

    expect(screen.getByText('Kab. Merauke')).toBeTruthy()
    expect(screen.getByText('Provinsi Papua Selatan')).toBeTruthy()
    expect(screen.getByText('30°C')).toBeTruthy()
    expect(screen.getByText('Baik')).toBeTruthy()
    expect(screen.queryByText(/Oktober 2026/)).toBeNull()
    expect(screen.queryByText('Sota')).toBeNull()
  })
})
