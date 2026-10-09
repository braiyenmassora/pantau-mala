/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { LocationCard } from '@/components/panel/location-card'
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

describe('LocationCard active', () => {
  beforeEach(() => {
    useMapStore.setState({
      location: { status: 'active', coords: { lon: 114.2, lat: -2.9 } },
    })
  })

  it('shows nearby info without action buttons', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          // Empty hotspots — card still renders with zero count / empty nearest
          queryFn: async () => ({ type: 'FeatureCollection', features: [] }),
        },
      },
    })
    client.setQueryData(['hotspots'], { type: 'FeatureCollection', features: [] })

    render(
      <QueryClientProvider client={client}>
        <LocationCard regions={[region]} />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Di sekitar kamu')).toBeTruthy()
    expect(screen.getByText('Dalam radius 25 km')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Lihat detail' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Matikan lokasi' })).toBeNull()
  })
})
