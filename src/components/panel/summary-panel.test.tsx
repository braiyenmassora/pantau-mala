/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { createRef, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SummaryPanel } from '@/components/panel/summary-panel'
import type { MapRef } from '@/components/ui/map'
import { TooltipProvider } from '@/components/ui/tooltip'
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
  titik_panas_24j: 0,
  tren_7h: [0, 0, 0, 0, 0, 0, 0],
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
    frp_mw: 0,
  },
  ringkasan: '',
  saran: [],
}

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  )
}

describe('SummaryPanel states', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })
    useMapStore.setState({
      province: 'Semua',
      query: '',
      selectedCode: null,
      selectedCategories: new Set(),
      location: { status: 'off' },
    })
  })

  it('shows skeleton while pending, not zero', () => {
    wrap(
      <SummaryPanel
        regions={[]}
        filtered={[]}
        mapRef={createRef<MapRef | null>()}
        isPending
        isError={false}
      />,
    )
    expect(screen.getByLabelText('Memuat')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
  })

  it('shows load fail empty state', () => {
    const onRetry = vi.fn()
    wrap(
      <SummaryPanel
        regions={[]}
        filtered={[]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError
        onRetry={onRetry}
      />,
    )
    expect(screen.getByText(copy.empty.loadFail.title)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.empty.loadFail.action }),
    ).toBeTruthy()
  })

  it('shows no-hotspots empty when totals are zero', () => {
    wrap(
      <SummaryPanel
        regions={[region]}
        filtered={[region]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError={false}
      />,
    )
    expect(screen.getByText(copy.empty.noHotspots.title)).toBeTruthy()
    expect(
      screen.getByText(copy.empty.noHotspots.description('Indonesia')),
    ).toBeTruthy()
  })

  it('shows search miss empty', () => {
    useMapStore.setState({ query: 'xyzzy' })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    client.setQueryData(['daftar-wilayah'], {
      provinsi: [],
      kabkota: [],
    })
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <SummaryPanel
            regions={[region]}
            filtered={[]}
            mapRef={createRef<MapRef | null>()}
            isPending={false}
            isError={false}
          />
        </TooltipProvider>
      </QueryClientProvider>,
    )
    expect(screen.getByText(copy.empty.searchMiss.title)).toBeTruthy()
  })

  it('shows filter empty with tampilkan semua', () => {
    useMapStore.setState({
      selectedCategories: new Set(['rendah']),
    })
    wrap(
      <SummaryPanel
        regions={[region]}
        filtered={[]}
        mapRef={createRef<MapRef | null>()}
        isPending={false}
        isError={false}
      />,
    )
    expect(screen.getByText(copy.empty.noRegionsFilter.title)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.empty.noRegionsFilter.action }),
    ).toBeTruthy()
  })
})
