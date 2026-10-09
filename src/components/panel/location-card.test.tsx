/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LocationCard } from '@/components/panel/location-card'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { useMapStore } from '@/store/map'

const region: Region = {
  kode: '62.11',
  nama: 'Kab. Pulang Pisau',
  provinsi: 'Kalimantan Tengah',
  zona_waktu: 'WIB',
  pusat: [114.25, -2.75],
  skor: 82,
  kategori: 'sangat_tinggi',
  titik_panas_24j: 23,
  tren_7h: [8, 10, 9, 14, 15, 19, 23],
  cuaca: {
    suhu_c: 34,
    kondisi: 'Cerah',
    kelembapan: 48,
    angin_kmj: 12,
    hari_tanpa_hujan: 9,
  },
  udara: { pm25: 62, kategori: 'tidak_sehat' },
  deteksi_terakhir: {
    waktu: '2026-10-09T13:55:00+07:00',
    satelit: 'MODIS Aqua',
    keyakinan: 'tinggi',
    frp_mw: 11.4,
  },
  ringkasan: '',
  saran: [],
}

describe('LocationCard', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    useMapStore.setState({
      location: { status: 'off' },
    })
  })

  it('shows nearby clear empty when active with no hotspots', () => {
    useMapStore.setState({
      location: { status: 'active', coords: { lon: 114.2, lat: -2.9 } },
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    client.setQueryData(['hotspots'], { type: 'FeatureCollection', features: [] })

    render(
      <QueryClientProvider client={client}>
        <LocationCard regions={[region]} />
      </QueryClientProvider>,
    )

    expect(screen.getByText(copy.empty.nearbyClear.title)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Lihat detail' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Matikan lokasi' })).toBeNull()
  })

  it('shows denied empty state', () => {
    useMapStore.setState({ location: { status: 'denied' } })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <LocationCard regions={[region]} />
      </QueryClientProvider>,
    )
    expect(screen.getByText(copy.empty.locationDenied.title)).toBeTruthy()
  })

  it('shows error empty with coba lagi', () => {
    useMapStore.setState({ location: { status: 'error' } })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <LocationCard regions={[region]} />
      </QueryClientProvider>,
    )
    expect(screen.getByText(copy.empty.locationError.title)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.empty.locationError.action }),
    ).toBeTruthy()
  })
})
