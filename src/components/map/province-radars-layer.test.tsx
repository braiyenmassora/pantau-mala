/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProvinceRadarsLayer } from '@/components/map/province-radars-layer'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

vi.mock('@/components/ui/map', () => ({
  MapMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="province-radar-marker">{children}</div>
  ),
  MarkerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/data/queries', () => ({
  useRegionCatalog: () => ({
    data: {
      provinces: [
        {
          code: '64',
          name: 'Kalimantan Timur',
          bbox: [113, -3, 119, 3],
          center: [116.5, 0.5],
        },
        {
          code: '62',
          name: 'Kalimantan Tengah',
          bbox: [110, -4, 116, 1],
          center: [113.5, -1.5],
        },
        {
          code: '31',
          name: 'DKI Jakarta',
          bbox: [106.6, -6.4, 107, -6],
          center: [106.8, -6.2],
        },
      ],
      regencies: [],
    },
  }),
}))

const baseRegion = {
  time_zone: 'WIB',
  weather_danger: null,
  trend_7d: [0, 0, 0, 0, 0, 0, 0],
  weather: { temp_c: 30, condition: 'Cerah', humidity: 60, wind_kmh: 8, dry_days: 2 },
  air_quality: { pm25: 25, category: 'baik' as const },
  last_detection: null,
  summary: '',
  actions: [],
}

const regions: Region[] = [
  {
    ...baseRegion,
    code: '64.01',
    name: 'Kab. Paser',
    province: 'Kalimantan Timur',
    center: [116, -1.8],
    risk_category: 'sangat_tinggi',
    hotspots_24h: 180,
  },
  {
    ...baseRegion,
    code: '62.01',
    name: 'Kab. Kotawaringin Barat',
    province: 'Kalimantan Tengah',
    center: [111.6, -2.4],
    risk_category: 'sedang',
    hotspots_24h: 8,
  },
  {
    ...baseRegion,
    code: '31.01',
    name: 'Kepulauan Seribu',
    province: 'DKI Jakarta',
    center: [106.8, -6.2],
    risk_category: 'rendah',
    hotspots_24h: 0,
  },
]

describe('ProvinceRadarsLayer', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useMapStore.setState({ province: 'Semua', selectedCode: null })
  })

  it('uses compositor-animated DOM rings for active hazard provinces', () => {
    render(<ProvinceRadarsLayer regions={regions} />)

    expect(screen.getAllByTestId('province-radar-marker')).toHaveLength(2)
    expect(screen.getAllByTestId('province-radar-ring')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /DKI Jakarta/ })).toBeNull()
  })

  it('opens a province from its accessible radar target', () => {
    render(<ProvinceRadarsLayer regions={regions} />)

    fireEvent.click(screen.getByRole('button', { name: /Kalimantan Timur/ }))
    expect(useMapStore.getState().province).toBe('Kalimantan Timur')
  })

  it('hides national radars after drill-down', () => {
    useMapStore.setState({ province: 'Kalimantan Timur' })
    render(<ProvinceRadarsLayer regions={regions} />)

    expect(screen.queryByTestId('province-radar-marker')).toBeNull()
  })
})
