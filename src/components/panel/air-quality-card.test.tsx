/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AirCategoryPill } from '@/components/panel/air-quality-card'
import { airPm25Value } from '@/lib/air-card'
import type { Region } from '@/data/types'

function baseRegion(air: Region['air_quality'], airUpdated?: string | null): Region {
  return {
    code: '62.11',
    name: 'Kab. Pulang Pisau',
    province: 'Kalimantan Tengah',
    time_zone: 'WIB',
    center: [114.25, -2.75],
    weather_danger: null,
    risk_category: 'sedang',
    hotspots_24h: 3,
    trend_7d: [1, 1, 1, 1, 1, 1, 3],
    weather: {
      temp_c: 30,
      condition: 'Cerah',
      humidity: 50,
      wind_kmh: 8,
      dry_days: 2,
    },
    air_quality: air,
    last_detection: null,
    summary: '',
    actions: [],
    air_updated_at: airUpdated ?? '2026-10-18T08:00:00+07:00',
  }
}

describe('airPm25Value', () => {
  it('formats ready pm25 for the conditions grid', () => {
    expect(
      airPm25Value(
        baseRegion({
          pm25: 12.4,
          category: 'baik',
          source: 'CAMS',
        }),
      ),
    ).toMatch(/12,4/)
  })

  it('hides pm25 when missing', () => {
    expect(airPm25Value(baseRegion({ pm25: null, category: 'missing' }))).toBeNull()
  })
})

describe('AirCategoryPill', () => {
  afterEach(cleanup)

  it('shows tidak sehat as a red pill', () => {
    render(
      <AirCategoryPill
        region={baseRegion({
          pm25: 53.6,
          category: 'tidak_sehat',
          source: 'CAMS',
        })}
      />,
    )
    const pill = screen.getByText('Tidak sehat')
    expect(pill.className).toMatch(/risk-high/)
  })

  it('hides pill when air is missing', () => {
    render(
      <AirCategoryPill region={baseRegion({ pm25: null, category: 'missing' })} />,
    )
    expect(screen.queryByText('Baik')).toBeNull()
  })
})
