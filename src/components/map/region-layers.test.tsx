/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegionLayers } from '@/components/map/region-layers'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

vi.mock('@/components/ui/map', () => ({
  useMap: () => ({
    map: {
      getLayer: () => false,
      getSource: () => false,
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
    },
    isLoaded: true,
  }),
  MapMarker: ({
    children,
    longitude,
    latitude,
  }: {
    children: ReactNode
    longitude: number
    latitude: number
  }) => (
    <div data-testid="dom-marker" data-lng={longitude} data-lat={latitude}>
      {children}
    </div>
  ),
  MarkerContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="marker-content">{children}</div>
  ),
}))

const mockRegions: Region[] = [
  {
    code: 'IDN.1.1',
    name: 'Kab. Sangat Rawan',
    province: 'Kalimantan Tengah',
    time_zone: 'WIB',
    center: [111.5, -2.5],
    label_point: [111.6, -2.4],
    weather_danger: null,
    risk_category: 'sangat_tinggi',
    hotspots_24h: 15,
    trend_7d: [0, 0, 0, 0, 2, 5, 8],
    weather: { temp_c: 32, condition: 'Cerah', humidity: 60, wind_kmh: 10, dry_days: 5 },
    air_quality: { pm25: 65, category: 'tidak_sehat' },
    last_detection: null,
    summary: '',
    actions: [],
  },
  {
    code: 'IDN.1.2',
    name: 'Kab. Sedang',
    province: 'Kalimantan Tengah',
    time_zone: 'WIB',
    center: [112.0, -2.0],
    weather_danger: null,
    risk_category: 'sedang',
    hotspots_24h: 3,
    trend_7d: [0, 0, 0, 0, 0, 1, 2],
    weather: { temp_c: 30, condition: 'Berawan', humidity: 70, wind_kmh: 8, dry_days: 2 },
    air_quality: { pm25: 35, category: 'sedang' },
    last_detection: null,
    summary: '',
    actions: [],
  },
  {
    code: 'IDN.1.3',
    name: 'Kab. Aman',
    province: 'Kalimantan Tengah',
    time_zone: 'WIB',
    center: [113.0, -1.5],
    weather_danger: null,
    risk_category: 'rendah',
    hotspots_24h: 0,
    trend_7d: [0, 0, 0, 0, 0, 0, 0],
    weather: {
      temp_c: 28,
      condition: 'Hujan Ringan',
      humidity: 85,
      wind_kmh: 5,
      dry_days: 0,
    },
    air_quality: { pm25: 12, category: 'baik' },
    last_detection: null,
    summary: '',
    actions: [],
  },
]

describe('RegionLayers', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useMapStore.setState({
      province: 'Kalimantan Tengah',
      selectedCode: null,
      hoveredCode: null,
    })
  })

  it('renders pulsing DOM markers without text labels', () => {
    render(<RegionLayers regions={mockRegions} />)

    const markers = screen.getAllByTestId('dom-marker')
    expect(markers).toHaveLength(3)

    // Kab. Sangat Rawan uses label_point [111.6, -2.4]
    expect(markers[0].getAttribute('data-lng')).toBe('111.6')
    expect(markers[0].getAttribute('data-lat')).toBe('-2.4')

    // Sangat tinggi: denyut soft lebih cepat
    const btnHigh = screen.getByRole('button', { name: 'Kab. Sangat Rawan' })
    const pulseHigh = btnHigh.querySelector('.marker--pulse') as HTMLElement
    expect(pulseHigh).toBeTruthy()
    expect(pulseHigh.style.getPropertyValue('--beat')).toBe('0.75s')

    // Sedang: denyut soft lebih pelan
    const btnMid = screen.getByRole('button', { name: 'Kab. Sedang' })
    const pulseMid = btnMid.querySelector('.marker--pulse') as HTMLElement
    expect(pulseMid).toBeTruthy()
    expect(pulseMid.style.getPropertyValue('--beat')).toBe('1.8s')

    // Nol titik: pin kecil tanpa riak (bukan accent)
    const btnLow = screen.getByRole('button', { name: 'Kab. Aman' })
    expect(btnLow.querySelector('.marker--pulse')).toBeNull()
  })

  it('opens detail on pin click', () => {
    render(<RegionLayers regions={mockRegions} />)

    const btnHigh = screen.getByRole('button', { name: 'Kab. Sangat Rawan' })
    fireEvent.click(btnHigh)

    expect(useMapStore.getState().selectedCode).toBe('IDN.1.1')
    expect(useMapStore.getState().query).toBe('')
  })

  it('shows tooltip card and scales marker when hovered', () => {
    render(<RegionLayers regions={mockRegions} />)

    const btnHigh = screen.getByRole('button', { name: 'Kab. Sangat Rawan' })
    fireEvent.mouseEnter(btnHigh)

    expect(screen.getByText('Kab. Sangat Rawan')).toBeTruthy()
    expect(useMapStore.getState().hoveredCode).toBe('IDN.1.1')
  })
})
