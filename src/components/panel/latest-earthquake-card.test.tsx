/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LatestEarthquakeCard } from '@/components/panel/latest-earthquake-card'
import { copy } from '@/copy/id'

vi.mock('@/data/queries', () => ({
  useEarthquakes: () => ({
    isPending: false,
    isError: false,
    data: {
      data: [
        {
          waktu: '2026-10-15T08:00:00Z',
          pusat: [120.5, -8.5] as [number, number],
          magnitudo: 3.8,
          kedalaman_km: 10,
          wilayah: 'Pusat gempa berada di laut 53 km utara Ruteng, Manggarai',
          potensi: 'Tidak berpotensi tsunami',
          dirasakan: 'IV di Pamijahan',
          shakemap: '',
        },
      ],
      sumber: 'BMKG',
      keterangan: 'Gempa terkini',
      diambil: '2026-10-15T08:05:00Z',
    },
  }),
}))

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('LatestEarthquakeCard', () => {
  afterEach(cleanup)

  it('renders BMKG latest quake without repeating Gempa M in the title', () => {
    wrap(<LatestEarthquakeCard />)

    expect(screen.getByText(copy.panel.seismicTitle)).toBeTruthy()
    expect(screen.queryByText('Gempa M 3,8')).toBeNull()
    expect(screen.getByText('M 3,8')).toBeTruthy()
    expect(
      screen.getByText('Pusat gempa berada di laut 53 km utara Ruteng, Manggarai'),
    ).toBeTruthy()
    expect(screen.getByText(/Kedalaman 10 km/)).toBeTruthy()
    expect(screen.getByText(/Dirasakan IV di Pamijahan/)).toBeTruthy()
  })
})
