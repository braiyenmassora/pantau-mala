/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProvincePinsLayer } from '@/components/map/province-pins-layer'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
}))

vi.mock('@/components/ui/map', () => ({
  useMap: () => ({ map: { fitBounds: vi.fn() } }),
  MapMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  MarkerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/data/queries', () => ({
  useRegionCatalog: () => ({
    data: {
      provinces: [
        {
          code: '63',
          name: 'Kalimantan Selatan',
          bbox: [114, -4, 116, -2] as [number, number, number, number],
          center: [115, -3] as [number, number],
        },
        {
          code: '36',
          name: 'Banten',
          bbox: [105, -7, 107, -5] as [number, number, number, number],
          center: [106, -6] as [number, number],
        },
      ],
      regencies: [],
    },
  }),
}))

const regions: Region[] = [
  {
    code: '63.01',
    name: 'Kab. A',
    province: 'Kalimantan Selatan',
    time_zone: 'WITA',
    center: [115, -3],
    weather_danger: null,
    risk_category: 'sangat_tinggi',
    hotspots_24h: 50,
    trend_7d: [0, 0, 0, 0, 0, 0, 50],
    weather: { temp_c: 30, condition: 'Cerah', humidity: 50, wind_kmh: 5, dry_days: 1 },
    air_quality: { pm25: 10, category: 'baik' },
    last_detection: null,
    summary: '',
    actions: [],
  },
  {
    code: '36.01',
    name: 'Kab. B',
    province: 'Banten',
    time_zone: 'WIB',
    center: [106, -6],
    weather_danger: null,
    risk_category: 'sedang',
    hotspots_24h: 3,
    trend_7d: [0, 0, 0, 0, 0, 1, 2],
    weather: { temp_c: 30, condition: 'Cerah', humidity: 50, wind_kmh: 5, dry_days: 1 },
    air_quality: { pm25: 10, category: 'baik' },
    last_detection: null,
    summary: '',
    actions: [],
  },
]

describe('ProvincePinsLayer', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useMapStore.setState({ province: 'Semua', selectedCode: null })
  })

  it('shows soft halo pins without numbers on national view', () => {
    render(<ProvincePinsLayer regions={regions} />)

    expect(screen.getByRole('button', { name: 'Kalimantan Selatan' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Banten' })).toBeTruthy()
    const halos = screen.getAllByTestId('province-pin-halo')
    expect(halos.some((el) => el.className.includes('animate-halo-high'))).toBe(true)
    expect(halos.some((el) => el.className.includes('animate-halo-mid'))).toBe(true)
    expect(screen.queryByText('50')).toBeNull()
    expect(screen.queryByText('3')).toBeNull()
  })

  it('hides pins when a province is selected', () => {
    useMapStore.setState({ province: 'Kalimantan Selatan', selectedCode: null })
    const { container } = render(<ProvincePinsLayer regions={regions} />)
    expect(container.firstChild).toBeNull()
  })
})
